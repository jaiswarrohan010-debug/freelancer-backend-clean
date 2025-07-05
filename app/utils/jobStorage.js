import AsyncStorage from '@react-native-async-storage/async-storage';

const JOBS_STORAGE_KEY = '@jobs';

export const saveJob = async (job) => {
  try {
    const existingJobs = await getJobs();
    const newJob = {
      ...job,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedJobs = [...existingJobs, newJob];
    await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updatedJobs));
    return newJob;
  } catch (error) {
    console.error('Error saving job:', error);
    throw error;
  }
};

export const getJobs = async () => {
  try {
    const jobs = await AsyncStorage.getItem(JOBS_STORAGE_KEY);
    return jobs ? JSON.parse(jobs) : [];
  } catch (error) {
    console.error('Error getting jobs:', error);
    return [];
  }
};

export const getClientJobs = async (clientId) => {
  try {
    const jobs = await getJobs();
    return jobs.filter(job => job.clientId === clientId);
  } catch (error) {
    console.error('Error getting client jobs:', error);
    return [];
  }
};

export const deleteJob = async (jobId) => {
  try {
    const jobs = await getJobs();
    const updatedJobs = jobs.filter(job => job.id !== jobId);
    await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updatedJobs));
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

export const updateJob = async (jobId, updatedJob) => {
  try {
    const jobs = await getJobs();
    const updatedJobs = jobs.map(job => 
      job.id === jobId 
        ? { ...job, ...updatedJob, updatedAt: new Date().toISOString() }
        : job
    );
    await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updatedJobs));
  } catch (error) {
    console.error('Error updating job:', error);
    throw error;
  }
}; 