document.addEventListener('DOMContentLoaded', async () => {
  try {
      const currentVersion = '2.8';
      
      // Set version number if element exists
      const versionElement = document.getElementById('ninjakit-current-version');
      if (versionElement) {
          versionElement.textContent = ' - v' + currentVersion;
      }

      // Try to fetch latest version (optional - won't break if fails)
      try {
          const response = await fetch('https://dl.dropboxusercontent.com/s/igsy2flzae4lbpp/Ninja_Blocker_Latest_Version.md?' + Math.random());
          const latestVersion = await response.text();
          
          if (latestVersion && latestVersion > currentVersion) {
              const updateElement = document.getElementById('ninjakit-update-available');
              if (updateElement) {
                  updateElement.innerHTML = '<span class="update-notification">v' + latestVersion + ' is Available!</span>';
                  updateElement.classList.remove('hidden');
              }
          }
      } catch (fetchError) {
          // Silently ignore version check errors
          console.log("Version check skipped");
      }

  } catch (error) {
      console.error("Error in get-data:", error);
  }
});
