//ViewInstallationsHook
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useViewInstallations = () => {
  const location = useLocation();

  // State will hold the array of installation task objects
  const [installationTasks, setInstallationTasks] = useState([]);

  useEffect(() => {
    const { dataItem } = location.state || {};

    if (dataItem) {
      // If dataItem has 'data' array, use it. Otherwise, fallback to dataItem itself.
      const tasksArray = dataItem.data ? dataItem.data : dataItem;

      if (Array.isArray(tasksArray)) {
        setInstallationTasks(tasksArray);
        // Save to localStorage as fallback
        localStorage.setItem('installationTasks', JSON.stringify(tasksArray));
      } else {
        setInstallationTasks([]);
        localStorage.removeItem('installationTasks');
      }
    } else {
      // Try loading from localStorage fallback
      const savedTasks = JSON.parse(localStorage.getItem('installationTasks'));
      if (savedTasks && Array.isArray(savedTasks)) {
        setInstallationTasks(savedTasks);
      }
    }
  }, [location]);

  return installationTasks;
};

export default useViewInstallations;
