import pool from "../config/db.js";

const createProject = async ({ 
  user_id, 
  title, 
  description,
  category,
  technologies, 
  area_of_focus, 
  university_name,
  funding_goals,
  timeline,
  file_path,
  file_name,
  file_size,
  file_type
}) => {
  const result = await pool.query(
    `INSERT INTO projects (
      user_id, title, description, category, technologies, 
      area_of_focus, university_name, funding_goals, timeline, 
      file_path, file_name, file_size, file_type, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending') RETURNING *`,
    [
      user_id, title, description, category, technologies, 
      area_of_focus, university_name, funding_goals, timeline, 
      file_path, file_name, file_size, file_type
    ]
  );
  return result.rows[0];
};

const getProjects = async () => {
  const result = await pool.query(`
    SELECT p.*, u.name as student_name, u.email as student_email 
    FROM projects p 
    JOIN users u ON p.user_id = u.id 
    ORDER BY p.created_at DESC
  `);
  return result.rows;
};

const getProjectsByUser = async (user_id) => {
  const result = await pool.query(`
    SELECT 
      p.*, 
      u.name as student_name, 
      u.email as student_email
    FROM projects p 
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = $1
    ORDER BY p.created_at DESC
  `, [user_id]);

  return result.rows.map(project => ({
    ...project,
    file_url: project.file_path ? `/uploads/${project.file_path}` : null
  }));
};

const getStudentDashboardStats = async (user_id) => {
  try {
    const totalProjectsResult = await pool.query(
      `SELECT COUNT(*) as total_projects FROM projects WHERE user_id = $1`,
      [user_id]
    );

    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count FROM projects WHERE user_id = $1 GROUP BY status`,
      [user_id]
    );

    const viewsResult = await pool.query(
      `SELECT COALESCE(SUM(views), 0) as total_views FROM projects WHERE user_id = $1`,
      [user_id]
    );

    const interestsResult = await pool.query(
      `SELECT COALESCE(SUM(investor_interests), 0) as total_interests FROM projects WHERE user_id = $1`,
      [user_id]
    );

    const ratingResult = await pool.query(
      `SELECT COALESCE(AVG(rating), 0) as average_rating FROM projects WHERE user_id = $1 AND rating > 0`,
      [user_id]
    );

    const recentProjects = await pool.query(
      `SELECT title, investor_interests, rating, created_at 
       FROM projects 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 3`,
      [user_id]
    );

    const projectStatus = {};
    statusResult.rows.forEach(row => {
      projectStatus[row.status] = parseInt(row.count);
    });

    const insights = generateInsights(
      totalProjectsResult.rows[0].total_projects,
      viewsResult.rows[0].total_views,
      interestsResult.rows[0].total_interests,
      recentProjects.rows
    );

    return {
      stats: {
        total_projects: parseInt(totalProjectsResult.rows[0].total_projects),
        total_views: parseInt(viewsResult.rows[0].total_views),
        total_interests: parseInt(interestsResult.rows[0].total_interests),
        average_rating: parseFloat(ratingResult.rows[0].average_rating) || 0
      },
      projectStatus,
      insights
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

const generateInsights = (totalProjects, totalViews, totalInterests, recentProjects) => {
  const insights = [];

  if (totalProjects === 0) {
    insights.push("Upload your first project to get started!");
    insights.push("Complete your profile to increase visibility");
    insights.push("Projects in Web Development category are trending");
    return insights;
  }

  if (totalViews === 0) {
    insights.push("Add more details to your projects to attract views");
  } else if (totalViews < 10) {
    insights.push("Your projects are starting to get attention!");
  } else {
    insights.push(`Your projects have been viewed ${totalViews} times`);
  }

  if (totalInterests === 0) {
    insights.push("Focus on detailed project descriptions to attract investors");
  } else if (totalInterests === 1) {
    insights.push("Great! You have 1 investor interested in your work");
  } else {
    insights.push(`Amazing! ${totalInterests} investors are interested in your projects`);
  }

  if (recentProjects.length > 0) {
    const latestProject = recentProjects[0];
    if (latestProject.investor_interests > 0) {
      insights.push(`"${latestProject.title}" has ${latestProject.investor_interests} investor interests`);
    }
    
    if (latestProject.rating > 4) {
      insights.push(`"${latestProject.title}" has excellent ratings!`);
    }
  }

  while (insights.length < 3) {
    insights.push("Keep uploading quality projects to grow your profile");
  }

  return insights.slice(0, 3);
};

const incrementProjectViews = async (project_id) => {
  const result = await pool.query(
    `UPDATE projects SET views = views + 1 WHERE id = $1 RETURNING views`,
    [project_id]
  );
  return result.rows[0];
};

const incrementInvestorInterests = async (project_id) => {
  const result = await pool.query(
    `UPDATE projects SET investor_interests = investor_interests + 1 WHERE id = $1 RETURNING investor_interests`,
    [project_id]
  );
  return result.rows[0];
};

const updateProjectRating = async (project_id, new_rating) => {
  const result = await pool.query(
    `UPDATE projects SET rating = $1 WHERE id = $2 RETURNING rating`,
    [new_rating, project_id]
  );
  return result.rows[0];
};

const getAllProjectsForInvestor = async () => {
  const result = await pool.query(`
    SELECT 
      p.*,
      u.name as student_name,
      u.email as student_email,
      u.phone as student_phone
    FROM projects p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = 'approved'
    ORDER BY p.created_at DESC
  `);
  return result.rows;
};

const createBid = async ({ project_id, investor_id, amount, message }) => {
  const result = await pool.query(
    `INSERT INTO bids (project_id, investor_id, amount, message, status) 
     VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
    [project_id, investor_id, amount, message]
  );
  return result.rows[0];
};

// ✅ FIXED: No 'export' keyword here – will be exported in the final block
const getUserBids = async (investorId) => {
  const result = await pool.query(`
    SELECT 
      b.*,
      p.title as project_title,
      p.description as project_description,
      u.name as student_name,
      u.email as student_email,
      COALESCE(py.student_confirmed, false) as student_confirmed
    FROM bids b
    JOIN projects p ON b.project_id = p.id
    JOIN users u ON p.user_id = u.id
    LEFT JOIN payments py ON b.id = py.bid_id
    WHERE b.investor_id = $1
    ORDER BY b.created_at DESC
  `, [investorId]);
  return result.rows;
};

const getAdminDashboardStats = async () => {
  const studentsResult = await pool.query(
    `SELECT COUNT(*) as count FROM users WHERE role = 'student'`
  );

  const investorsResult = await pool.query(
    `SELECT COUNT(*) as count FROM users WHERE role = 'investor'`
  );

  const projectsResult = await pool.query(
    `SELECT COUNT(*) as count FROM projects`
  );

  const bidsResult = await pool.query(
    `SELECT COUNT(*) as count FROM bids WHERE status = 'pending'`
  );

  const fundingsResult = await pool.query(
    `SELECT COUNT(*) as count FROM bids WHERE status = 'approved'`
  );

  const complaintsResult = await pool.query(
    `SELECT COUNT(*) as count FROM complaints WHERE status = 'pending'`
  );

  const recentActivities = await pool.query(`
    (SELECT 'project' as type, title as name, created_at FROM projects ORDER BY created_at DESC LIMIT 5)
    UNION ALL
    (SELECT 'bid' as type, CONCAT('Bid of $', amount) as name, created_at FROM bids ORDER BY created_at DESC LIMIT 5)
    ORDER BY created_at DESC LIMIT 5
  `);

  return {
    totalStudents: parseInt(studentsResult.rows[0].count),
    totalInvestors: parseInt(investorsResult.rows[0].count),
    totalProjects: parseInt(projectsResult.rows[0].count),
    activeBids: parseInt(bidsResult.rows[0].count),
    approvedFundings: parseInt(fundingsResult.rows[0].count),
    complaintsPending: parseInt(complaintsResult.rows[0].count),
    recentActivities: recentActivities.rows
  };
};

const getAllUsers = async () => {
  const result = await pool.query(`
    SELECT id, name, email, role, phone, cnic, created_at 
    FROM users 
    ORDER BY created_at DESC
  `);
  return result.rows;
};

const getAllProjectsForAdmin = async () => {
  const result = await pool.query(`
    SELECT 
      p.*,
      u.name AS student_name,
      u.email AS student_email,
      p.file_name,
      p.file_path,
      p.file_type,
      p.file_size,
      CONCAT('/uploads/', p.file_path) as file_url
    FROM projects p
    LEFT JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `);

  return result.rows;
};

const getProjectById = async (project_id) => {
  const result = await pool.query(
    `SELECT * FROM projects WHERE id = $1`,
    [project_id]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

// ========== INVESTOR FEATURE FUNCTIONS ==========
const getProjectLikes = async (project_id) => {
  const result = await pool.query(
    'SELECT COUNT(*) as likes FROM project_likes WHERE project_id = $1',
    [project_id]
  );
  return parseInt(result.rows[0].likes);
};

const userLikedProject = async (user_id, project_id) => {
  const result = await pool.query(
    'SELECT 1 FROM project_likes WHERE user_id = $1 AND project_id = $2',
    [user_id, project_id]
  );
  return result.rowCount > 0;
};

const toggleProjectLike = async (user_id, project_id) => {
  const liked = await userLikedProject(user_id, project_id);
  if (liked) {
    await pool.query(
      'DELETE FROM project_likes WHERE user_id = $1 AND project_id = $2',
      [user_id, project_id]
    );
    return { liked: false, likes: await getProjectLikes(project_id) };
  } else {
    await pool.query(
      'INSERT INTO project_likes (user_id, project_id) VALUES ($1, $2)',
      [user_id, project_id]
    );
    return { liked: true, likes: await getProjectLikes(project_id) };
  }
};

const getAllBidsForAdmin = async () => {
  const result = await pool.query(`
    SELECT 
      b.*,
      p.title as project_title,
      inv.name as investor_name,
      inv.email as investor_email,
      stu.name as student_name,
      stu.email as student_email
    FROM bids b
    JOIN projects p ON b.project_id = p.id
    JOIN users inv ON b.investor_id = inv.id
    JOIN users stu ON p.user_id = stu.id
    ORDER BY b.created_at DESC
  `);
  return result.rows;
};

const getInvestorBidCredits = async (investor_id) => {
  const result = await pool.query(
    'SELECT free_bids_remaining, paid_bids_remaining FROM users WHERE id = $1',
    [investor_id]
  );
  return result.rows[0] || { free_bids_remaining: 0, paid_bids_remaining: 0 };
};

const deductBidCredit = async (investor_id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const credits = await client.query(
      'SELECT free_bids_remaining, paid_bids_remaining FROM users WHERE id = $1 FOR UPDATE',
      [investor_id]
    );
    if (credits.rows.length === 0) throw new Error('User not found');
    let { free_bids_remaining, paid_bids_remaining } = credits.rows[0];
    if (free_bids_remaining > 0) {
      free_bids_remaining -= 1;
      await client.query(
        'UPDATE users SET free_bids_remaining = $1 WHERE id = $2',
        [free_bids_remaining, investor_id]
      );
    } else if (paid_bids_remaining > 0) {
      paid_bids_remaining -= 1;
      await client.query(
        'UPDATE users SET paid_bids_remaining = $1 WHERE id = $2',
        [paid_bids_remaining, investor_id]
      );
    } else {
      throw new Error('No bid credits remaining');
    }
    await client.query('COMMIT');
    return { free_bids_remaining, paid_bids_remaining };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const addPaidBids = async (investor_id, pack_size) => {
  const result = await pool.query(
    'UPDATE users SET paid_bids_remaining = paid_bids_remaining + $1 WHERE id = $2 RETURNING paid_bids_remaining',
    [pack_size, investor_id]
  );
  return result.rows[0].paid_bids_remaining;
};

// ✅ SINGLE EXPORT – all functions listed here, no duplicates
export {
  createProject,
  getProjects,
  getProjectsByUser,
  getStudentDashboardStats,
  incrementProjectViews,
  incrementInvestorInterests,
  updateProjectRating,
  getAllProjectsForInvestor,
  createBid,
  getUserBids,            // ✅ Only once, no 'export const' above
  getAdminDashboardStats,
  getAllUsers,
  getAllProjectsForAdmin,
  getProjectById,
  getProjectLikes,
  userLikedProject,
  toggleProjectLike,
  getAllBidsForAdmin,
  getInvestorBidCredits,
  deductBidCredit,
  addPaidBids
};