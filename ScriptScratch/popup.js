document.addEventListener('DOMContentLoaded', () => {
  const books = document.querySelectorAll(".book");
  const pages = document.querySelectorAll(".page");
  const saveButtons = document.querySelectorAll(".save-btn");
  const cancelButtons = document.querySelectorAll(".cancel-btn");
  const savedMessages = document.querySelectorAll(".saved");
  const progressBars = document.querySelectorAll(".progress-bar");
  const eraseButtons = document.querySelectorAll(".del-btn");
  const pageTitles = document.querySelectorAll(".page-h1");
  const bookHeads = document.querySelectorAll(".heads");
  const wordLimit = 2000;

  const timeRangeSelect = document.getElementById('timeRange');
  const chartTypeSelect = document.getElementById('chartType');
  const noDataMessage = document.getElementById('no-data-message');
  const firstObButton = document.getElementById('first-ob');
  const secondObButton = document.getElementById('second-ob');
  const thirdObButton = document.getElementById('third-ob');
  const notesSection = document.getElementById('notes-section');
  const notesDiv = document.getElementById('notes');
  const chartCanvas = document.getElementById('chart');
  const searchBox = document.getElementById('search-box');
  const librarySection = document.getElementById('library-section');
  const guidePage = document.getElementById('guide-page'); 
  const fourtButton = document.getElementById('fourth-ob');

  timeRangeSelect.addEventListener('change', updateChart);
  chartTypeSelect.addEventListener('change', updateChart);
  firstObButton.addEventListener('click', showNotes);
  secondObButton.addEventListener('click', showChart);
  thirdObButton.addEventListener('click', showLibrary);
  fourtButton.addEventListener('click', showGuidePage);
  searchBox.addEventListener('input', filterNotes);

  showChart();

  books.forEach((book, index) => {
    const titleKey = `book-${index + 1}-title`;
    const bookKey = `book-${index + 1}-content`;
    chrome.storage.local.get([titleKey, bookKey], function (result) {
      bookHeads[index].textContent = result[titleKey] || `Book ${index + 1}`;
      updateProgressBar(result[bookKey] || "", index);
    });
  });

  books.forEach((book, index) => {
    book.addEventListener("click", (event) => {
      if (event.target.classList.contains('del-btn')) return; 
      document.getElementById("visible-books").style.display = "none";
      pages.forEach(page => page.style.display = "none");
      pages[index].style.display = "block";

      const textarea = pages[index].querySelector(".page-textarea");
      const bookKey = `book-${index + 1}-content`;
      const titleKey = `book-${index + 1}-title`;
      chrome.storage.local.get([bookKey, titleKey], function (result) {
        textarea.value = result[bookKey] || "";
        pageTitles[index].textContent = result[titleKey] || bookHeads[index].textContent;
        updateProgressBar(textarea.value, index);
      });

      textarea.addEventListener('input', () => {
        const wordCount = textarea.value.split(/\s+/).filter(word => word.length > 0).length;
        if (wordCount > wordLimit) {
          textarea.value = textarea.value.split(/\s+/).slice(0, wordLimit).join(' ');
          alert(`You have reached the word limit of ${wordLimit} words.`);
        }
        updateProgressBar(textarea.value, index);
      });
    });
  });

  saveButtons.forEach((saveButton, index) => {
    saveButton.addEventListener("click", () => {
      const textarea = pages[index].querySelector(".page-textarea");
      const savedMessage = savedMessages[index];
      const content = textarea.value;
      const title = pageTitles[index].textContent;

      if (!content.trim() && (!title.trim() || title.trim() === `Book ${index + 1}`)) {
        return; 
      }

      const bookKey = `book-${index + 1}-content`;
      const titleKey = `book-${index + 1}-title`;
      chrome.storage.local.set({ [bookKey]: content, [titleKey]: title }, () => {
        savedMessage.style.display = "block"; 
        setTimeout(() => {
          savedMessage.style.display = "none";
        }, 1000);
      });

      updateProgressBar(content, index); 
    });
  });

  cancelButtons.forEach((cancelButton, index) => {
    cancelButton.addEventListener("click", () => {
      pages[index].style.display = "none";
      document.getElementById("visible-books").style.display = "flex"; 
    });
  });

  pageTitles.forEach((title, index) => {
    title.addEventListener("click", () => {
      const newTitle = prompt("Enter a new title (max 30 characters)", title.textContent);
      if (newTitle && newTitle.length <= 30) {
        title.textContent = newTitle;
        bookHeads[index].textContent = newTitle;
        const titleKey = `book-${index + 1}-title`;
        chrome.storage.local.set({ [titleKey]: newTitle });
      } else if (newTitle && newTitle.length > 30) {
        alert("Title cannot exceed 30 characters!");
      }
    });
  });

  eraseButtons.forEach((button, index) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const isConfirmed = confirm("Are you sure you want to erase this book?");
      if (isConfirmed) {
        const bookKey = `book-${index + 1}-content`;
        const titleKey = `book-${index + 1}-title`;
        chrome.storage.local.remove([bookKey, titleKey], () => {
          const textarea = pages[index].querySelector(".page-textarea");
          textarea.value = "";
          pageTitles[index].textContent = `Book ${index + 1}`;
          bookHeads[index].textContent = `Book ${index + 1}`;
          updateProgressBar("", index);
        });
      }
    });
  });
  
  function updateProgressBar(content, index) {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length; 
    const progress = Math.min((wordCount / wordLimit) * 100, 100); 
    const progressBar = progressBars[index];
    const progressText = progressBar.querySelector('.progress-text'); 

    progressBar.style.width = `${progress}%`; 
    progressText.textContent = `${Math.round(progress)}%`; 
  }

  function updateChart() {
    const selectedRange = timeRangeSelect.value;
    const selectedChartType = chartTypeSelect.value;
    const now = Date.now();
    let rangeInMs;

    switch (selectedRange) {
      case '1h':
        rangeInMs = 3600000; 
        break;
      case '24h':
        rangeInMs = 86400000; 
        break;
      case '1w':
        rangeInMs = 604800000; 
        break;
      case '1m':
        rangeInMs = 2592000000; 
        break;
      default:
        rangeInMs = 3600000;
    }

    chrome.history.search({ text: '', startTime: now - rangeInMs, maxResults: 4000 }, historyItems => {
      const siteTimes = {};

      historyItems.forEach(item => {
        const url = new URL(item.url);
        const domain = url.hostname;
        if (!siteTimes[domain]) {
          siteTimes[domain] = { count: 0, lastVisit: [] };
        }
        siteTimes[domain].count += 1;
        siteTimes[domain].lastVisit.push(item.lastVisitTime);
      });

      const totalInteractions = Object.values(siteTimes).reduce((sum, site) => sum + site.count, 0);

      const sortedSites = Object.entries(siteTimes).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
      const labels = sortedSites.map(entry => entry[0]);
      const data = sortedSites.map(entry => entry[1].count);
      const percentages = sortedSites.map(entry => ((entry[1].count / totalInteractions) * 100).toFixed(2));

      if (data.length === 0) {
        noDataMessage.style.display = 'block';
        chartCanvas.style.display = 'none';
        return;
      } else {
        noDataMessage.style.display = 'none';
        chartCanvas.style.display = 'block';
      }

      const colors = [
        '#264653', 
        '#2a9d8f', 
        '#e9c46a', 
        '#f4a261', 
        '#e76f51', 
        '#6a4c93',
        '#3b5998', 
        '#c70049',
        '#5f0f40', 
        '#44af69'  
      ];

      const ctx = chartCanvas.getContext('2d');
      if (window.chart && typeof window.chart.destroy === 'function') {
        window.chart.destroy();
      }
      window.chart = new Chart(ctx, {
        type: selectedChartType,
        data: {
          labels: labels,
          datasets: [{
            label: 'Interaction Count',
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: '#000000',
            borderWidth: 2
          }, {
            label: 'Interaction Percentage (%)',
            data: percentages,
            backgroundColor: colors.slice(0, labels.length).map(color => color + 'B3'), 
            borderColor: '#000000',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeInOutQuad'
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                padding: 20,
                boxWidth: 20,
                boxHeight: 20,
                font: {
                  size: 14,
                  style: 'bold'
                },
                color: '#000000'
              }
            },
            title: {
              display: true,
              padding: {
                top: 10,
                bottom: 30
              },
              font: {
                size: 20,
                style: 'bold'
              }
            }
          }
        }
      });
    });
  }

  function showChart() {
    chartCanvas.style.display = 'block';
    noDataMessage.style.display = 'none';
    notesSection.style.display = 'none';
    librarySection.style.display = 'none';
    guidePage.style.display = 'none';
    timeRangeSelect.disabled = false;
    chartTypeSelect.disabled = false;
    updateChart();
  }

  function showNotes() {
    chartCanvas.style.display = 'none';
    noDataMessage.style.display = 'none';
    librarySection.style.display = 'none';
    notesSection.style.display = 'block';
    guidePage.style.display = 'none';
    timeRangeSelect.disabled = true;
    chartTypeSelect.disabled = true;
    notesDiv.innerHTML = '';

    chrome.storage.local.get({ notes: [] }, function (result) {
      let notes = result.notes;

      if (notes.length === 0) {
        notesDiv.innerHTML = '<div class="no-notes">No Notes</div>';
        notesDiv.style.color = 'white';
        notesDiv.style.paddingBottom = '5px';
        notesDiv.style.fontSize = '15px';
        notesDiv.style.fontWeight = 'bolder';
        notesDiv.style.display = 'flex';
        notesDiv.style.justifyContent = 'center';
        notesDiv.style.alignItems = 'center';
        searchBox.disabled = true;
      } else {
        notes.forEach((note, index) => {
          const noteElement = document.createElement('div');
          noteElement.style.padding = '10px';
          noteElement.style.margin = '5px 0';
          noteElement.style.backgroundColor = 'white';
          noteElement.style.borderRadius = '5px';
          noteElement.style.boxShadow = 'rgba(0, 0, 0, 0.6) 0px -3px 0px inset';
          noteElement.style.marginBottom = '10px';
          noteElement.style.overflow = 'hidden';
          noteElement.style.width = '100%';
          noteElement.innerHTML = `
            <div>
              <strong>${note.timestamp}</strong><br>
              <a href="${note.url}" target="_blank">${note.url}</a> - ${note.content}
            </div>
            <button class="delete-note" data-index="${index}">Delete</button>
          `;
          notesDiv.appendChild(noteElement);
        });

        document.querySelectorAll('.delete-note').forEach(button => {
          button.addEventListener('click', function () {
            const index = this.getAttribute('data-index');
            deleteNote(index);
          });
        });

        searchBox.disabled = false;
      }
    });
  }

  function showLibrary() {
    chartCanvas.style.display = 'none';
    noDataMessage.style.display = 'none';
    notesSection.style.display = 'none';
    guidePage.style.display = 'none';
    librarySection.style.display = 'block';
    timeRangeSelect.disabled = true;
    chartTypeSelect.disabled = true;
  }

  function filterNotes() {
    const searchTerm = searchBox.value.toLowerCase();
    const notes = notesDiv.children;
    let noteFound = false;

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const content = note.textContent.toLowerCase();
      if (content.includes(searchTerm)) {
        note.style.display = '';
        noteFound = true;
      } else {
        note.style.display = 'none';
      }
    }

    let noNotesMessage = document.querySelector('.no-notes');
    if (!noNotesMessage) {
      noNotesMessage = document.createElement('div');
      noNotesMessage.className = 'no-notes';
      noNotesMessage.textContent = 'No Results Found';
      noNotesMessage.style.color = 'white';
      noNotesMessage.style.fontSize = '14px';
      noNotesMessage.style.fontWeight = 'bold';
      noNotesMessage.style.textAlign = 'center';
      noNotesMessage.style.width = '100%';
      noNotesMessage.style.marginBottom = '5px';
      notesDiv.appendChild(noNotesMessage);
    }

    if (!noteFound) {
      noNotesMessage.style.display = 'block';
    } else {
      noNotesMessage.style.display = 'none';
    }
  }

  function deleteNote(index) {
    chrome.storage.local.get({ notes: [] }, function (result) {
      let notes = result.notes;
      notes.splice(index, 1);
      chrome.storage.local.set({ notes: notes }, function () {
        showNotes();
        UpdateNoteCount();
      });
    });
  }

  function showGuidePage(){
    chartCanvas.style.display = 'none';
    noDataMessage.style.display = 'none';
    notesSection.style.display = 'none';
    librarySection.style.display = 'none';
    guidePage.style.display = 'block';
    timeRangeSelect.disabled = true;
    chartTypeSelect.disabled = true;
  }

  UpdateNoteCount();
  function UpdateNoteCount(){
    chrome.storage.local.get({notes: []}, function(result) {
      const notesCount = result.notes.length;
      document.getElementById('notes-count').innerHTML = notesCount;
    });
  }

  function updateActiveTime() {
    chrome.runtime.sendMessage({ action: "getDailyActiveTime" }, (response) => {
      document.getElementById('active-time').innerText = `DAT: ${response.hours}h| ${response.minutes}m| ${response.seconds}s`;
    });
  }
  updateActiveTime();
  setInterval(updateActiveTime, 1000);

});
