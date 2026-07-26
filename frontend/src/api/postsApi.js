import API from './api'; // or however you import your API instance

// Get all posts
export const getPosts = async () => {
  try {
    const response = await API.get('/posts/student/community');
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Get single post by ID
export const getPost = async (id) => {
  try {
    const response = await API.get(`/posts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

// Create a new post
export const createPost = async (postData) => {
  try {
    const response = await API.post('/posts', postData);
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Add comment to a post
export const addComment = async (postId, commentData) => {
  try {
    const response = await API.post(`/comments/post/${postId}`, commentData);
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Get comments for a post
export const getComments = async (postId) => {
  try {
    const response = await API.get(`/comments/post/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// Get user's own posts
export const getMyPosts = async () => {
  try {
    const response = await API.get('/posts/user/my-posts');
    return response.data;
  } catch (error) {
    console.error('Error fetching my posts:', error);
    throw error;
  }
};