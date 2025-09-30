//ViewServices
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useViewServices = () => {
  const location = useLocation();

  // State will hold the array of installation task objects
  const [installationTasks, setInstallationTasks] = useState([]);

  useEffect(() => {
    const { dataItem } = location.state || {};

    if (dataItem) {
      // If dataItem has 'data' array, use it. Otherwise, fallback to dataItem itself.
      const tasksArray = dataItem.data ? dataItem.data : dataItem;

      if (Array.isArray(tasksArray)) {
        const enrichedTasks = tasksArray.map((task) => {
          const addressObject = task.address && typeof task.address === 'object' ? task.address : {};
          const fallbackOrderDelivery = task.orderDelivery || {};
          const city = task.city || addressObject.city || fallbackOrderDelivery.city || '';
          const district = task.district || addressObject.district || fallbackOrderDelivery.district || '';
          const state = task.state || addressObject.state || fallbackOrderDelivery.state || '';
          const country = task.country || addressObject.country || fallbackOrderDelivery.country || '';
          const pincode = task.pincode || addressObject.pincode || fallbackOrderDelivery.pincode || '';

          return {
            ...task,
            city,
            district,
            state,
            country,
            pincode,
            addressline1: task.addressline1 || addressObject.addressline1 || fallbackOrderDelivery.addressline1 || '',
            addressline2: task.addressline2 || addressObject.addressline2 || fallbackOrderDelivery.addressline2 || '',
          };
        });

        setInstallationTasks(enrichedTasks);
        // Save to localStorage as fallback
        localStorage.setItem('installationTasks', JSON.stringify(enrichedTasks));
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

export default useViewServices;
