FROM python:3.11-slim

# Set the working directory for the application
WORKDIR /app

# Copy and install dependencies
# We copy just the requirements file first to leverage Docker layer caching.
COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application source code into the container
COPY apps/api/src /app

# Expose the port Uvicorn will run on
EXPOSE 8080

# Start the FastAPI server when the container launches
CMD ["uvicorn", "scoutzos.main:app", "--host", "0.0.0.0", "--port", "8080"]
