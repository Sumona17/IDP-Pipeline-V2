# Workflow Engine

### Project Structure
- **backend:** Contains the Springboot backend code.
- **client:** Contains the React client code.

## Installation Steps

### Clone the Repository
Open gitbash and run the following commands:
```
git clone https://github.com/mukherjeesrabana/Workflow-Engine.git
cd Workflow-Engine
```
### Database Setup
- Create a database table named **workflow-engine**.
- Once the springboot application is run, tables will be imported to MySQL Workbench.

### Backend Setup
Refer to .properties file in the backend folder for database connectivity.
**- Run the Backend Server:**
```
Run backend from any java code editor (intellij preferred).
```
The backend server will run at port 8080.

### Frontend Setup
**- Install Frontend Dependencies:**
```
cd client
npm install
```
**- Run the Frontend Server:**
```
npm run dev
```
The frontend server will be available at http://localhost:5173/.
