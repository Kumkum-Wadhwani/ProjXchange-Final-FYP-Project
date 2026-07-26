import React, { useState } from "react";
import API from "../api/api";

const AddProject = ({ studentId }) => {
  const [formData, setFormData] = useState({
    title: "",
    technologies: "",
    area: "",
    university: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, student_id: studentId };
      const response = await API.post("/projects", data);
      alert(response.data.message);
      setFormData({ title: "", technologies: "", area: "", university: "" });
    } catch (error) {
      console.error(error);
      alert("Error adding project");
    }
  };

  return (
    <div className="add-project">
      <h2>Add New Project</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Project Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="technologies"
          placeholder="Technologies Used"
          value={formData.technologies}
          onChange={handleChange}
        />
        <input
          type="text"
          name="area"
          placeholder="Area of Focus"
          value={formData.area}
          onChange={handleChange}
        />
        <input
          type="text"
          name="university"
          placeholder="University Name"
          value={formData.university}
          onChange={handleChange}
        />
        <button type="submit">Submit Project</button>
      </form>
    </div>
  );
};

export default AddProject;
