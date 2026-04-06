document.addEventListener('DOMContentLoaded', async () => {
  try {
      const currentVersion = '2.8';

      const fetchVersion = async (url) => {
          const response = await fetch(url + '?' + Math.random());
          return await response.text();
      };

      const toggleElements = (selector) => {
          document.querySelectorAll(selector).forEach(element => element.classList.toggle('hidden'));
      };
      
      document.getElementById('ninjakit-current-version').textContent = ' - v' + currentVersion;

      const latestVersion = await fetchVersion('https://dl.dropboxusercontent.com/s/igsy2flzae4lbpp/Ninja_Blocker_Latest_Version.md');
    //   const currentVersion = await fetchVersion('https://dl.dropboxusercontent.com/s/i7t958d6ukcx9vg/Ninja_Blocker_Current_Version.md');
       

      const changelogData = await fetchVersion('https://dl.dropboxusercontent.com/s/3gyb94pgxbdx2jx/Ninja_Blocker_Changelog.md');
      document.getElementById('changelog').innerHTML = changelogData;

      if (latestVersion > currentVersion) {
          const updateAvailableElement = document.getElementById('ninjakit-update-available');
          updateAvailableElement.innerHTML = '<span class="update-notification">v' + latestVersion + ' is Available!</span>';
          updateAvailableElement.classList.toggle('hidden');
      }

      document.getElementById('changelog-btn').addEventListener('click', () => {
          toggleElements('.tab-wrapper.dialog-tab-item');
          toggleElements('.controls-block');
      });

      document.querySelector('.second-btn #back-btn').addEventListener('click', () => {
          toggleElements('.tab-wrapper.dialog-tab-item');
          toggleElements('.controls-block');
      });

      setTimeout(() => {
          const ninjakitCheck = document.getElementById('ninjakit-current-version').textContent;
          if (!ninjakitCheck) {
              window.location.href = "popup.html";
          }
      }, 4000);
  } catch (error) {
      console.error("Error fetching versions:", error);
  }
});