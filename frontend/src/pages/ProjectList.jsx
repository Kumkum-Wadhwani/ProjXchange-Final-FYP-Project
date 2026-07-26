import React, { useEffect, useState } from "react";
import API from "../api/api";

const ProjectList = ({ studentId }) => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await API.get(`/projects/student/${studentId}`);
        setProjects(response.data.projects);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProjects();
  }, [studentId]);

  return (
    <div className="project-list">
      <h2>My Projects</h2>
      {projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <h3>{project.title}</h3>
              <p>Technologies: {project.technologies}</p>
              <p>Area: {project.area}</p>
              <p>University: {project.university}</p>
              <p>Created At: {new Date(project.created_at).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectList;
