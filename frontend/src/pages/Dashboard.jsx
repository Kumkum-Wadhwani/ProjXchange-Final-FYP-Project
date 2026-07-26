import React from "react";
import AddProject from "./AddProject";
import ProjectList from "./ProjectList";

const Dashboard = () => {
  const studentId = 1; // Replace with actual logged-in student ID

  return (
    <div className="dashboard">
      <h1>Student Dashboard</h1>
      <AddProject studentId={studentId} />
      <ProjectList studentId={studentId} />
    </div>
  );
};

export default Dashboard;
