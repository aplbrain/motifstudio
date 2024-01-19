# Use an official Python runtime as a parent image
FROM python:3.11-slim-buster

# Set the working directory in the container to /app
WORKDIR /app

# Install git because we need it for some python packages
RUN apt-get update && apt-get install -y git

# Install from /app/requirements/requirements.in
COPY requirements/requirements.in /app/requirements/requirements.in
RUN pip install --no-cache-dir -r requirements/requirements.in

# Copy the current directory contents into the container at /app
COPY . /app

# Install uvicorn
RUN pip install uvicorn

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run uvicorn when the container launches
CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8000"]
