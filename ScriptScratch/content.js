chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "addNote") {
    const x = window.scrollX + window.innerWidth / 2;
    const y = window.scrollY + window.innerHeight / 2;

    const noteContainer = document.createElement('div');
    noteContainer.style.position = 'absolute';
    noteContainer.style.left = `${x}px`;
    noteContainer.style.top = `${y}px`;
    noteContainer.style.backgroundColor = '#9da0a2'; 
    noteContainer.style.padding = '10px';
    noteContainer.style.border = '1px solid black';
    noteContainer.style.borderRadius = '5px'; 
    noteContainer.style.boxShadow = 'rgba(0, 0, 0, 0.2) 0px -4px 0px inset'; 
    noteContainer.style.zIndex = '9999'; 

    const textarea = document.createElement('textarea');
    textarea.setAttribute("placeholder", "Write note...");
    textarea.style.width = '300px';
    textarea.style.height = '200px';
    textarea.style.fontSize = '14px';
    textarea.style.fontFamily = 'monospace';
    textarea.style.fontWeight = 'bolder';
    textarea.style.color = 'black';
    textarea.style.paddingLeft = '5px';
    textarea.style.backgroundColor = '#fec89a'; 
    textarea.style.border = '3px solid rgb(125, 125, 125)';
    textarea.style.borderRadius = '5px';
    textarea.style.outline = 'none'; 
    textarea.style.resize = 'both';
    textarea.style.boxShadow = 
      '2px 2px 0px rgba(0, 0, 0, 1), ' +  
      '-2px -2px 0px rgba(0, 0, 0, 1), ' + 
      '2px -2px 0px rgba(0, 0, 0, 1), ' +  
      '-2px 2px 0px rgba(0, 0, 0, 1)';     
    noteContainer.appendChild(textarea);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.marginTop = '5px';
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.justifyContent = 'flex-end'; 

    const saveButton = document.createElement('button');
    saveButton.innerHTML = 'Save';
    saveButton.style.backgroundImage = 'linear-gradient(#e1e1e1, #aeaeae)';
    saveButton.style.color = 'black';
    saveButton.style.border = 'none';
    saveButton.style.padding = '5px';
    saveButton.style.borderRadius = '3px';
    saveButton.style.fontWeight = 'bolder';
    saveButton.style.boxShadow = '0px 1px 2px ,rgba(0, 0, 0, 0.2) 0px -3px 0px inset';
    saveButton.style.cursor = 'pointer';
    saveButton.style.marginRight = '5px';
    saveButton.style.fontFamily = 'monospace';
    saveButton.style.fontSize = '12px';
    buttonsDiv.appendChild(saveButton);

    const cancelButton = document.createElement('button');
    cancelButton.innerHTML = 'Cancel';
    cancelButton.style.backgroundImage = 'linear-gradient(#e9e9e9, #c4c4c4)';
    cancelButton.style.color = 'black';
    cancelButton.style.border = 'none';
    cancelButton.style.padding = '5px';
    cancelButton.style.borderRadius = '3px';
    cancelButton.style.fontWeight = 'bolder';
    cancelButton.style.boxShadow = '0px 1px 2px ,rgba(0, 0, 0, 0.2) 0px -3px 0px inset';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontFamily = 'monospace';
    cancelButton.style.fontSize = '12px';
    buttonsDiv.appendChild(cancelButton);

    noteContainer.appendChild(buttonsDiv);
    document.body.appendChild(noteContainer);

    cancelButton.addEventListener('click', () => {
      document.body.removeChild(noteContainer);
    });

    saveButton.addEventListener('click', () => {
      const noteContent = textarea.value;
      const now = new Date();
      const noteObject = {
        url: window.location.href,
        content: noteContent,
        position: { x, y },
        timestamp: now.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) 
      };
      saveNoteToStorage(noteObject);
      document.body.removeChild(noteContainer);
    });

    function saveNoteToStorage(note) {
      chrome.storage.local.get({ notes: [] }, function(result) {
        let notes = result.notes;
        notes.push(note);
        chrome.storage.local.set({ notes: notes });
      });
    }

    saveButton.addEventListener('mouseenter', () => {
      saveButton.style.backgroundImage = 'linear-gradient(#e9e9e9, #c4c4c4)';
    });
    saveButton.addEventListener('mouseleave', () => {
      saveButton.style.backgroundImage = 'linear-gradient(#e1e1e1, #aeaeae)';
    });

    cancelButton.addEventListener('mouseenter', () => {
      cancelButton.style.backgroundImage = 'linear-gradient(#e9e9e9, #c4c4c4)';
    });
    cancelButton.addEventListener('mouseleave', () => {
      cancelButton.style.backgroundImage = 'linear-gradient(#e1e1e1, #aeaeae)';
    });

    let isDragging = false;
    let offsetX, offsetY;

    noteContainer.addEventListener('mousedown', (e) => {
      if (e.target !== textarea) { 
        isDragging = true;
        offsetX = e.clientX - noteContainer.offsetLeft;
        offsetY = e.clientY - noteContainer.offsetTop;
        noteContainer.style.cursor = 'grabbing';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        noteContainer.style.left = `${e.clientX - offsetX}px`;
        noteContainer.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      noteContainer.style.cursor = 'grab'; 
    });
  }
});
