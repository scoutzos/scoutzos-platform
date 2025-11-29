-- ============================================================
-- SCOUTZOS AI ADVISOR SCORING FUNCTIONS
-- Version: 1.0
-- Description: PostgreSQL functions for deal-to-buy-box matching
-- ============================================================

-- ============================================================
-- 1. PRICE SCORE CALCULATION
-- ============================================================
-- Returns 0-100 based on where price falls relative to buy box range
-- Below range: 90 minus small penalty (still good - under budget)
-- In range: 90-100 (bonus for lower end of range)
-- Above range: Heavy penalty based on how far over

CREATE OR REPLACE FUNCTION calculate_price_score(
    price NUMERIC,
    min_price NUMERIC,
    max_price NUMERIC
) RETURNS INTEGER AS $$
DECLARE
    score INTEGER;
    range_size NUMERIC;
    position_in_range NUMERIC;
    over_percentage NUMERIC;
    under_percentage NUMERIC;
BEGIN
    -- Handle nulls
    IF price IS NULL THEN
        RETURN 50; -- Neutral score if no price
    END IF;

    -- If no range specified, give neutral score
    IF min_price IS NULL AND max_price IS NULL THEN
        RETURN 75;
    END IF;

    -- Only max specified
    IF min_price IS NULL THEN
        IF price <= max_price THEN
            -- Under max: score based on how far under
            position_in_range := (max_price - price) / max_price;
            score := 85 + (position_in_range * 15)::INTEGER;
            RETURN LEAST(100, score);
        ELSE
            -- Over max: penalty
            over_percentage := (price - max_price) / max_price * 100;
            score := 80 - (over_percentage * 2)::INTEGER;
            RETURN GREATEST(0, score);
        END IF;
    END IF;

    -- Only min specified
    IF max_price IS NULL THEN
        IF price >= min_price THEN
            RETURN 85; -- Meets minimum, good score
        ELSE
            -- Below min: small penalty (might be too cheap/risky)
            under_percentage := (min_price - price) / min_price * 100;
            score := 85 - (under_percentage * 0.5)::INTEGER;
            RETURN GREATEST(60, score);
        END IF;
    END IF;

    -- Both min and max specified
    range_size := max_price - min_price;

    IF range_size <= 0 THEN
        -- Invalid range, check if price matches
        IF price = min_price THEN
            RETURN 100;
        ELSE
            RETURN 50;
        END IF;
    END IF;

    IF price < min_price THEN
        -- Below range: still good but slight penalty
        under_percentage := (min_price - price) / min_price * 100;
        score := 88 - (under_percentage * 0.3)::INTEGER;
        RETURN GREATEST(70, score);
    ELSIF price > max_price THEN
        -- Above range: significant penalty
        over_percentage := (price - max_price) / max_price * 100;
        IF over_percentage <= 5 THEN
            score := 75; -- Just slightly over
        ELSIF over_percentage <= 10 THEN
            score := 60;
        ELSIF over_percentage <= 20 THEN
            score := 40;
        ELSE
            score := 20 - (over_percentage - 20)::INTEGER;
        END IF;
        RETURN GREATEST(0, score);
    ELSE
        -- In range: 90-100, bonus for lower end
        position_in_range := (price - min_price) / range_size;
        score := 100 - (position_in_range * 10)::INTEGER;
        RETURN GREATEST(90, LEAST(100, score));
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_price_score IS 'Scores a deal price against buy box range (0-100). Favors prices at lower end of range.';


-- ============================================================
-- 2. LOCATION SCORE CALCULATION
-- ============================================================
-- Matches deal location against buy box markets
-- ZIP exact match = 100
-- Same city/neighborhood = 90
-- Same market area = 80
-- Same state = 60
-- No match = 0

CREATE OR REPLACE FUNCTION calculate_location_score(
    deal_zip TEXT,
    deal_city TEXT,
    deal_state TEXT,
    deal_county TEXT,
    buy_box_markets JSONB
) RETURNS INTEGER AS $$
DECLARE
    market JSONB;
    market_type TEXT;
    market_value TEXT;
    best_score INTEGER := 0;
    current_score INTEGER;
BEGIN
    -- Handle nulls
    IF buy_box_markets IS NULL OR jsonb_array_length(buy_box_markets) = 0 THEN
        RETURN 75; -- No location preference, neutral score
    END IF;

    -- Check each market in the buy box
    FOR market IN SELECT * FROM jsonb_array_elements(buy_box_markets)
    LOOP
        current_score := 0;

        -- Markets can be: { "type": "zip|city|county|state|metro", "value": "..." }
        -- Or simple strings: "Austin, TX" or "78701"

        IF jsonb_typeof(market) = 'object' THEN
            market_type := market->>'type';
            market_value := LOWER(market->>'value');
        ELSE
            -- Simple string - detect type
            market_value := LOWER(market #>> '{}');
            IF market_value ~ '^\d{5}$' THEN
                market_type := 'zip';
            ELSIF market_value ~ '^[a-z]{2}$' THEN
                market_type := 'state';
            ELSE
                market_type := 'city';
            END IF;
        END IF;

        -- Score based on match type
        CASE market_type
            WHEN 'zip' THEN
                IF LOWER(deal_zip) = market_value THEN
                    current_score := 100;
                ELSIF deal_zip IS NOT NULL AND LEFT(deal_zip, 3) = LEFT(market_value, 3) THEN
                    -- Same ZIP prefix (nearby)
                    current_score := 85;
                END IF;

            WHEN 'city' THEN
                IF LOWER(deal_city) = market_value OR
                   LOWER(deal_city) = SPLIT_PART(market_value, ',', 1) THEN
                    current_score := 90;
                END IF;

            WHEN 'county' THEN
                IF LOWER(deal_county) = market_value THEN
                    current_score := 85;
                END IF;

            WHEN 'metro' THEN
                -- Metro area matching would need a lookup table
                -- For now, match on city or county
                IF LOWER(deal_city) = market_value OR LOWER(deal_county) = market_value THEN
                    current_score := 80;
                END IF;

            WHEN 'state' THEN
                IF LOWER(deal_state) = market_value THEN
                    current_score := 60;
                END IF;

            ELSE
                -- Try to match as city, state format "Austin, TX"
                IF market_value LIKE '%,%' THEN
                    IF LOWER(deal_city) = TRIM(SPLIT_PART(market_value, ',', 1)) AND
                       LOWER(deal_state) = TRIM(SPLIT_PART(market_value, ',', 2)) THEN
                        current_score := 90;
                    ELSIF LOWER(deal_state) = TRIM(SPLIT_PART(market_value, ',', 2)) THEN
                        current_score := 60;
                    END IF;
                ELSE
                    -- Single value - try state first, then city
                    IF LOWER(deal_state) = market_value THEN
                        current_score := 60;
                    ELSIF LOWER(deal_city) = market_value THEN
                        current_score := 90;
                    END IF;
                END IF;
        END CASE;

        -- Keep best score
        IF current_score > best_score THEN
            best_score := current_score;
        END IF;

        -- Short circuit if perfect match
        IF best_score = 100 THEN
            RETURN 100;
        END IF;
    END LOOP;

    RETURN best_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_location_score IS 'Scores deal location against buy box markets (0-100). ZIP=100, City=90, Metro=80, State=60.';


-- ============================================================
-- 3. FINANCIAL SCORE CALCULATION
-- ============================================================
-- Averages scores for: cap_rate, cash_on_cash, dscr, all_in_to_arv
-- Each metric: meets target = 80-100, below = penalty

CREATE OR REPLACE FUNCTION calculate_financial_score(
    deal_cap_rate NUMERIC,
    deal_cash_on_cash NUMERIC,
    deal_dscr NUMERIC,
    deal_all_in_to_arv NUMERIC,
    deal_profit_margin NUMERIC,
    deal_rent_to_price NUMERIC,
    target_cap_rate NUMERIC,
    target_cash_on_cash NUMERIC,
    min_dscr NUMERIC,
    max_all_in_to_arv NUMERIC,
    min_profit_margin NUMERIC,
    min_rent_to_price NUMERIC,
    strategy TEXT
) RETURNS INTEGER AS $$
DECLARE
    scores INTEGER[] := '{}';
    cap_score INTEGER;
    coc_score INTEGER;
    dscr_score INTEGER;
    arv_score INTEGER;
    profit_score INTEGER;
    rtp_score INTEGER;
    avg_score NUMERIC;
BEGIN
    -- Cap Rate Score (higher is better)
    IF deal_cap_rate IS NOT NULL AND target_cap_rate IS NOT NULL THEN
        IF deal_cap_rate >= target_cap_rate THEN
            -- Meets or exceeds target
            cap_score := 80 + LEAST(20, ((deal_cap_rate - target_cap_rate) / target_cap_rate * 100)::INTEGER);
        ELSE
            -- Below target
            cap_score := (deal_cap_rate / target_cap_rate * 80)::INTEGER;
        END IF;
        scores := array_append(scores, GREATEST(0, LEAST(100, cap_score)));
    END IF;

    -- Cash on Cash Score (higher is better)
    IF deal_cash_on_cash IS NOT NULL AND target_cash_on_cash IS NOT NULL THEN
        IF deal_cash_on_cash >= target_cash_on_cash THEN
            coc_score := 80 + LEAST(20, ((deal_cash_on_cash - target_cash_on_cash) / target_cash_on_cash * 100)::INTEGER);
        ELSE
            coc_score := (deal_cash_on_cash / target_cash_on_cash * 80)::INTEGER;
        END IF;
        scores := array_append(scores, GREATEST(0, LEAST(100, coc_score)));
    END IF;

    -- DSCR Score (higher is better, min typically 1.0-1.25)
    IF deal_dscr IS NOT NULL AND min_dscr IS NOT NULL THEN
        IF deal_dscr >= min_dscr THEN
            dscr_score := 80 + LEAST(20, ((deal_dscr - min_dscr) / min_dscr * 50)::INTEGER);
        ELSE
            dscr_score := (deal_dscr / min_dscr * 80)::INTEGER;
        END IF;
        scores := array_append(scores, GREATEST(0, LEAST(100, dscr_score)));
    END IF;

    -- All-in to ARV Score (lower is better, for BRRRR)
    IF deal_all_in_to_arv IS NOT NULL AND max_all_in_to_arv IS NOT NULL THEN
        IF deal_all_in_to_arv <= max_all_in_to_arv THEN
            -- Under max is good, lower is better
            arv_score := 80 + LEAST(20, ((max_all_in_to_arv - deal_all_in_to_arv) / max_all_in_to_arv * 100)::INTEGER);
        ELSE
            -- Over max
            arv_score := 80 - ((deal_all_in_to_arv - max_all_in_to_arv) / max_all_in_to_arv * 200)::INTEGER;
        END IF;
        scores := array_append(scores, GREATEST(0, LEAST(100, arv_score)));
    END IF;

    -- Profit Margin Score (for flips, higher is better)
    IF deal_profit_margin IS NOT NULL AND min_profit_margin IS NOT NULL THEN
        IF deal_profit_margin >= min_profit_margin THEN
            profit_score := 80 + LEAST(20, ((deal_profit_margin - min_profit_margin) / min_profit_margin * 50)::INTEGER);
        ELSE
            profit_score := (deal_profit_margin / min_profit_margin * 80)::INTEGER;
        END IF;
        scores := array_append(scores, GREATEST(0, LEAST(100, profit_score)));
    END IF;

    -- Rent to Price Score (1% rule, higher is better)
    IF deal_rent_to_price IS NOT NULL AND min_rent_to_price IS NOT NULL THEN
        IF deal_rent_to_price >= min_rent_to_price THEN
            rtp_score := 80 + LEAST(20, ((deal_rent_to_price - min_rent_to_price) / min_rent_to_price * 100)::INTEGER);
        ELSE
            rtp_score := (deal_rent_to_price / min_rent_to_price * 80)::INTEGER;
        END IF;
        scores := array_append(scores, GREATEST(0, LEAST(100, rtp_score)));
    END IF;

    -- Calculate average of available scores
    IF array_length(scores, 1) IS NULL OR array_length(scores, 1) = 0 THEN
        RETURN 50; -- No financial data, neutral score
    END IF;

    SELECT AVG(s)::INTEGER INTO avg_score FROM unnest(scores) AS s;

    RETURN COALESCE(avg_score, 50);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_financial_score IS 'Scores deal financials against buy box targets (0-100). Averages cap_rate, CoC, DSCR, ARV ratio scores.';


-- ============================================================
-- 4. PROPERTY SCORE CALCULATION
-- ============================================================
-- Type match = 40 points
-- Beds in range = 20 points
-- Baths in range = 20 points
-- Sqft in range = 20 points

CREATE OR REPLACE FUNCTION calculate_property_score(
    deal_type TEXT,
    deal_beds INTEGER,
    deal_baths NUMERIC,
    deal_sqft INTEGER,
    deal_year_built INTEGER,
    bb_property_types JSONB,
    bb_min_beds INTEGER,
    bb_max_beds INTEGER,
    bb_min_baths NUMERIC,
    bb_max_baths NUMERIC,
    bb_min_sqft INTEGER,
    bb_max_sqft INTEGER,
    bb_min_year_built INTEGER,
    bb_max_year_built INTEGER
) RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    type_match BOOLEAN := FALSE;
    prop_type TEXT;
BEGIN
    -- Property Type Match (40 points)
    IF bb_property_types IS NULL OR jsonb_array_length(bb_property_types) = 0 THEN
        -- No type preference, full points
        score := score + 40;
    ELSE
        -- Check if deal type is in buy box types
        FOR prop_type IN SELECT jsonb_array_elements_text(bb_property_types)
        LOOP
            IF LOWER(deal_type) = LOWER(prop_type) THEN
                type_match := TRUE;
                EXIT;
            END IF;
        END LOOP;

        IF type_match THEN
            score := score + 40;
        END IF;
    END IF;

    -- Beds in Range (20 points)
    IF deal_beds IS NULL THEN
        score := score + 10; -- Partial points for unknown
    ELSIF (bb_min_beds IS NULL OR deal_beds >= bb_min_beds) AND
          (bb_max_beds IS NULL OR deal_beds <= bb_max_beds) THEN
        score := score + 20;
    ELSIF bb_min_beds IS NOT NULL AND deal_beds = bb_min_beds - 1 THEN
        score := score + 10; -- Close
    ELSIF bb_max_beds IS NOT NULL AND deal_beds = bb_max_beds + 1 THEN
        score := score + 10; -- Close
    END IF;

    -- Baths in Range (20 points)
    IF deal_baths IS NULL THEN
        score := score + 10;
    ELSIF (bb_min_baths IS NULL OR deal_baths >= bb_min_baths) AND
          (bb_max_baths IS NULL OR deal_baths <= bb_max_baths) THEN
        score := score + 20;
    ELSIF bb_min_baths IS NOT NULL AND deal_baths >= bb_min_baths - 0.5 THEN
        score := score + 10;
    ELSIF bb_max_baths IS NOT NULL AND deal_baths <= bb_max_baths + 0.5 THEN
        score := score + 10;
    END IF;

    -- Sqft in Range (20 points)
    IF deal_sqft IS NULL THEN
        score := score + 10;
    ELSIF (bb_min_sqft IS NULL OR deal_sqft >= bb_min_sqft) AND
          (bb_max_sqft IS NULL OR deal_sqft <= bb_max_sqft) THEN
        score := score + 20;
    ELSE
        -- Partial credit based on how close
        IF bb_min_sqft IS NOT NULL AND deal_sqft < bb_min_sqft THEN
            IF deal_sqft >= bb_min_sqft * 0.9 THEN
                score := score + 15;
            ELSIF deal_sqft >= bb_min_sqft * 0.8 THEN
                score := score + 10;
            END IF;
        END IF;
        IF bb_max_sqft IS NOT NULL AND deal_sqft > bb_max_sqft THEN
            IF deal_sqft <= bb_max_sqft * 1.1 THEN
                score := score + 15;
            ELSIF deal_sqft <= bb_max_sqft * 1.2 THEN
                score := score + 10;
            END IF;
        END IF;
    END IF;

    -- Bonus/Penalty for year built (implicit in score, not separate points)
    IF deal_year_built IS NOT NULL THEN
        IF bb_min_year_built IS NOT NULL AND deal_year_built < bb_min_year_built THEN
            score := score - 5; -- Small penalty for older than wanted
        END IF;
        IF bb_max_year_built IS NOT NULL AND deal_year_built > bb_max_year_built THEN
            -- Usually no max year preference, but if set, slight penalty
            score := score - 2;
        END IF;
    END IF;

    RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_property_score IS 'Scores deal property attributes against buy box (0-100). Type=40pts, Beds=20pts, Baths=20pts, Sqft=20pts.';


-- ============================================================
-- 5. WEIGHTED SCORE CALCULATION
-- ============================================================
-- Combines component scores with strategy-specific weights

CREATE OR REPLACE FUNCTION calculate_weighted_score(
    price_score INTEGER,
    financial_score INTEGER,
    location_score INTEGER,
    property_score INTEGER,
    strategy TEXT
) RETURNS INTEGER AS $$
DECLARE
    w_price NUMERIC;
    w_financial NUMERIC;
    w_location NUMERIC;
    w_property NUMERIC;
    weighted_score NUMERIC;
BEGIN
    -- Default weights
    w_price := 0.25;
    w_financial := 0.30;
    w_location := 0.25;
    w_property := 0.20;

    -- Strategy-specific weights
    CASE UPPER(COALESCE(strategy, ''))
        WHEN 'FLIP', 'FIX_AND_FLIP', 'WHOLESALE' THEN
            -- Flips: ARV margin is critical
            w_price := 0.25;
            w_financial := 0.35;
            w_location := 0.20;
            w_property := 0.20;

        WHEN 'BRRRR' THEN
            -- BRRRR: Financials most important (all-in-to-ARV, refi potential)
            w_price := 0.20;
            w_financial := 0.40;
            w_location := 0.20;
            w_property := 0.20;

        WHEN 'BUY_HOLD', 'BUY_AND_HOLD', 'RENTAL' THEN
            -- Buy & Hold: Cash flow and location for appreciation
            w_price := 0.15;
            w_financial := 0.45;
            w_location := 0.25;
            w_property := 0.15;

        WHEN 'STR', 'SHORT_TERM_RENTAL', 'AIRBNB' THEN
            -- STR: Location is king
            w_price := 0.20;
            w_financial := 0.30;
            w_location := 0.35;
            w_property := 0.15;

        WHEN 'MTR', 'MEDIUM_TERM_RENTAL' THEN
            -- MTR: Balance of location and financials
            w_price := 0.20;
            w_financial := 0.35;
            w_location := 0.30;
            w_property := 0.15;

        WHEN 'HOUSE_HACK' THEN
            -- House Hack: Property layout matters more
            w_price := 0.25;
            w_financial := 0.30;
            w_location := 0.20;
            w_property := 0.25;

        WHEN 'SUBJECT_TO', 'SELLER_FINANCE', 'CREATIVE' THEN
            -- Creative: Price flexibility, financials
            w_price := 0.30;
            w_financial := 0.35;
            w_location := 0.20;
            w_property := 0.15;

        ELSE
            -- Default balanced weights
            NULL;
    END CASE;

    -- Calculate weighted score
    weighted_score :=
        (COALESCE(price_score, 50) * w_price) +
        (COALESCE(financial_score, 50) * w_financial) +
        (COALESCE(location_score, 50) * w_location) +
        (COALESCE(property_score, 50) * w_property);

    RETURN ROUND(weighted_score)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_weighted_score IS 'Combines component scores with strategy-specific weights. Returns 0-100.';


-- ============================================================
-- 6. DISTANCE CALCULATION (Haversine)
-- ============================================================
-- Returns distance in miles between two lat/lon points

CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    earth_radius_miles NUMERIC := 3959;
    dlat NUMERIC;
    dlon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    -- Handle nulls
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;

    -- Convert to radians
    lat1 := radians(lat1);
    lon1 := radians(lon1);
    lat2 := radians(lat2);
    lon2 := radians(lon2);

    dlat := lat2 - lat1;
    dlon := lon2 - lon1;

    -- Haversine formula
    a := sin(dlat / 2) ^ 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ^ 2;
    c := 2 * asin(sqrt(a));

    RETURN ROUND((earth_radius_miles * c)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Calculates distance in miles between two coordinates using Haversine formula.';


-- ============================================================
-- 7. GET MATCHING DEALS
-- ============================================================
-- Main function to find and score deals for a buy box

CREATE OR REPLACE FUNCTION get_matching_deals(
    p_buy_box_id UUID,
    p_min_score INTEGER DEFAULT 60,
    p_limit_count INTEGER DEFAULT 50
) RETURNS TABLE (
    deal_id UUID,
    match_score INTEGER,
    price_score INTEGER,
    financial_score INTEGER,
    location_score INTEGER,
    property_score INTEGER,
    deal_data JSONB
) AS $$
DECLARE
    bb RECORD;
BEGIN
    -- Get buy box details
    SELECT * INTO bb FROM buy_boxes WHERE id = p_buy_box_id;

    IF bb IS NULL THEN
        RAISE EXCEPTION 'Buy box not found: %', p_buy_box_id;
    END IF;

    RETURN QUERY
    WITH scored_deals AS (
        SELECT
            d.id AS deal_id,

            -- Calculate component scores
            calculate_price_score(
                d.list_price,
                bb.min_price,
                bb.max_price
            ) AS calc_price_score,

            calculate_financial_score(
                dm.cap_rate,
                dm.cash_on_cash,
                dm.dscr,
                dm.all_in_to_arv,
                dm.profit_margin,
                dm.rent_to_price,
                bb.target_cap_rate,
                bb.target_cash_on_cash,
                bb.min_dscr,
                bb.max_all_in_to_arv,
                bb.min_profit_margin,
                bb.min_rent_to_price,
                bb.strategy
            ) AS calc_financial_score,

            calculate_location_score(
                d.zip,
                d.city,
                d.state,
                d.county,
                bb.markets
            ) AS calc_location_score,

            calculate_property_score(
                d.property_type,
                d.beds,
                d.baths,
                d.sqft,
                d.year_built,
                bb.property_types,
                bb.min_beds,
                bb.max_beds,
                bb.min_baths,
                bb.max_baths,
                bb.min_sqft,
                bb.max_sqft,
                bb.min_year_built,
                bb.max_year_built
            ) AS calc_property_score,

            -- Deal data as JSONB
            jsonb_build_object(
                'id', d.id,
                'address', d.address_line1,
                'city', d.city,
                'state', d.state,
                'zip', d.zip,
                'property_type', d.property_type,
                'beds', d.beds,
                'baths', d.baths,
                'sqft', d.sqft,
                'year_built', d.year_built,
                'list_price', d.list_price,
                'days_on_market', d.days_on_market,
                'status', d.status,
                'source', d.source,
                'photos', d.photos,
                'metrics', CASE
                    WHEN dm.id IS NOT NULL THEN jsonb_build_object(
                        'cap_rate', dm.cap_rate,
                        'cash_on_cash', dm.cash_on_cash,
                        'dscr', dm.dscr,
                        'monthly_cash_flow', dm.monthly_cash_flow,
                        'all_in_to_arv', dm.all_in_to_arv,
                        'profit_margin', dm.profit_margin
                    )
                    ELSE NULL
                END
            ) AS deal_data

        FROM deals d
        LEFT JOIN deal_metrics dm ON dm.deal_id = d.id
        WHERE
            -- Only active deals
            d.status IN ('new', 'analyzing', 'saved')

            -- Tenant filter (same org)
            AND d.tenant_id = bb.tenant_id

            -- Basic property type filter (if specified)
            AND (
                bb.property_types IS NULL
                OR jsonb_array_length(bb.property_types) = 0
                OR d.property_type = ANY(
                    SELECT jsonb_array_elements_text(bb.property_types)
                )
            )

            -- Price range pre-filter (loose, with 20% buffer)
            AND (bb.min_price IS NULL OR d.list_price >= bb.min_price * 0.8)
            AND (bb.max_price IS NULL OR d.list_price <= bb.max_price * 1.2)
    )
    SELECT
        sd.deal_id,
        calculate_weighted_score(
            sd.calc_price_score,
            sd.calc_financial_score,
            sd.calc_location_score,
            sd.calc_property_score,
            bb.strategy
        ) AS match_score,
        sd.calc_price_score AS price_score,
        sd.calc_financial_score AS financial_score,
        sd.calc_location_score AS location_score,
        sd.calc_property_score AS property_score,
        sd.deal_data
    FROM scored_deals sd
    WHERE calculate_weighted_score(
        sd.calc_price_score,
        sd.calc_financial_score,
        sd.calc_location_score,
        sd.calc_property_score,
        bb.strategy
    ) >= p_min_score
    ORDER BY match_score DESC
    LIMIT p_limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_matching_deals IS 'Finds and scores deals matching a buy box criteria. Returns top matches above min_score.';


-- ============================================================
-- 8. QUICK MATCH CHECK
-- ============================================================
-- Fast function to check if a single deal matches a buy box

CREATE OR REPLACE FUNCTION check_deal_match(
    p_deal_id UUID,
    p_buy_box_id UUID
) RETURNS TABLE (
    matches BOOLEAN,
    match_score INTEGER,
    price_score INTEGER,
    financial_score INTEGER,
    location_score INTEGER,
    property_score INTEGER,
    reasons JSONB
) AS $$
DECLARE
    bb RECORD;
    d RECORD;
    dm RECORD;
    v_price_score INTEGER;
    v_financial_score INTEGER;
    v_location_score INTEGER;
    v_property_score INTEGER;
    v_match_score INTEGER;
    v_reasons JSONB := '[]'::JSONB;
BEGIN
    -- Get buy box
    SELECT * INTO bb FROM buy_boxes WHERE id = p_buy_box_id;
    IF bb IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 0, 0, 0, 0, '["Buy box not found"]'::JSONB;
        RETURN;
    END IF;

    -- Get deal
    SELECT * INTO d FROM deals WHERE id = p_deal_id;
    IF d IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 0, 0, 0, 0, '["Deal not found"]'::JSONB;
        RETURN;
    END IF;

    -- Get deal metrics
    SELECT * INTO dm FROM deal_metrics WHERE deal_id = p_deal_id;

    -- Calculate scores
    v_price_score := calculate_price_score(d.list_price, bb.min_price, bb.max_price);

    v_financial_score := calculate_financial_score(
        dm.cap_rate, dm.cash_on_cash, dm.dscr, dm.all_in_to_arv,
        dm.profit_margin, dm.rent_to_price,
        bb.target_cap_rate, bb.target_cash_on_cash, bb.min_dscr,
        bb.max_all_in_to_arv, bb.min_profit_margin, bb.min_rent_to_price,
        bb.strategy
    );

    v_location_score := calculate_location_score(d.zip, d.city, d.state, d.county, bb.markets);

    v_property_score := calculate_property_score(
        d.property_type, d.beds, d.baths, d.sqft, d.year_built,
        bb.property_types, bb.min_beds, bb.max_beds, bb.min_baths, bb.max_baths,
        bb.min_sqft, bb.max_sqft, bb.min_year_built, bb.max_year_built
    );

    v_match_score := calculate_weighted_score(
        v_price_score, v_financial_score, v_location_score, v_property_score,
        bb.strategy
    );

    -- Build reasons
    IF v_price_score >= 80 THEN
        v_reasons := v_reasons || '["Price in range"]'::JSONB;
    ELSIF v_price_score >= 60 THEN
        v_reasons := v_reasons || '["Price slightly outside range"]'::JSONB;
    ELSE
        v_reasons := v_reasons || '["Price outside range"]'::JSONB;
    END IF;

    IF v_location_score >= 80 THEN
        v_reasons := v_reasons || '["Location matches"]'::JSONB;
    ELSIF v_location_score >= 60 THEN
        v_reasons := v_reasons || '["Location in same state"]'::JSONB;
    ELSIF v_location_score > 0 THEN
        v_reasons := v_reasons || '["Location partially matches"]'::JSONB;
    ELSE
        v_reasons := v_reasons || '["Location does not match"]'::JSONB;
    END IF;

    RETURN QUERY SELECT
        v_match_score >= 60,
        v_match_score,
        v_price_score,
        v_financial_score,
        v_location_score,
        v_property_score,
        v_reasons;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_deal_match IS 'Quick check if a deal matches a buy box with detailed scoring breakdown.';


-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
