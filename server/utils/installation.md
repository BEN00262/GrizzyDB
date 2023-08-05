#### GrizzyDB 'self-hosted' Database Installation Instructions

##### Requirements
1. Node.js
2. Git

##### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/GrizzyDB/grizzydb-monitor.git --depth=1
   ```

2. Navigate to the project directory:
   ```bash
   cd grizzydb-monitor
   ```

3. Create a `.env` file in the project directory. Copy the fields below and replace only the following values with your specific credentials:
   - `DB_HOST`: Replace with your database host URL.
   - `DB_NAME`: Replace with your database name.
   - `DB_USER`: Replace with your database username.
   - `DB_PASSWORD`: Replace with your database password.

   ```bash
   DB_DIALECT={{db_dialect}} # Do not change this

   DB_HOST=<replace this with your database host URL>
   DB_NAME=<replace this with your database name>
   DB_USER=<replace this with your database username>
   DB_PASSWORD=<replace this with your database password>
   ```

4. Install project dependencies:
   ```bash
   npm install
   ```

5. Install pm2 globally (if not already installed):
   ```bash
   npm install -g pm2
   ```

6. Set up pm2 to start on system boot:
   ```bash
   pm2 startup
   ```

7. Start the GrizzyDB Monitor application using pm2:
   ```bash
   pm2 start index.js --name GrizzyDBMonitor
   ```