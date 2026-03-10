const container = document.getElementById('puzzle-container');
const fileInput = document.getElementById('file-input');
const unsplashBtn = document.getElementById('unsplash-btn');
const contextMenu = document.getElementById('context-menu');
const menuGrid = document.getElementById('menu-grid');
const toggleBtn = document.getElementById('togglePanelBtn');
const controlsPanel = document.getElementById('controlsPanel');
let pieces = [];
let draggedPiece = null;
let originalSlot = null;
let isDragging = !1;
let startX, startY;
let dragClone = null;
let dragOffsetX, dragOffsetY;
const taillePiece = 200;
const unsplashImages = [{
    name: "Images by Europeana on unsplash - https://unsplash.com/fr/@europeana",
    url: "https://images.unsplash.com/photo-1753287532682-884f023c5544?w=600&h=600&fit=crop"
}, {
    name: "Images by Europeana on unsplash - https://unsplash.com/fr/@europeana",
    url: "https://images.unsplash.com/photo-1753286437247-49ae106b6334?w=600&h=600&fit=crop"
}, {
    name: "Images by Europeana on unsplash - https://unsplash.com/fr/@europeana",
    url: "https://images.unsplash.com/photo-1752302112804-428ddd5a89e7?w=600&h=600&fit=crop"
}, {
    name: "Images by Europeana on unsplash - https://unsplash.com/fr/@europeana",
    url: "https://images.unsplash.com/photo-1751732347302-1c87062321b2?w=600&h=600&fit=crop"
}, {
    name: "Images by Europeana on unsplash - https://unsplash.com/fr/@europeana",
    url: "https://images.unsplash.com/photo-1751732347274-684f46a48468?w=600&h=600&fit=crop"
}, {
    name: "Images by Europeana on unsplash - https://unsplash.com/fr/@europeana",
    url: "https://images.unsplash.com/photo-1751730739594-9d016ed468b5?w=600&h=600&fit=crop"
}, {
    name: "Images by Europeana on unsplash - https://unsplash.com/fr/@europeana",
    url: "https://images.unsplash.com/photo-1750922179522-36b534c0ce54?w=600&h=600&fit=crop"
}, {
    name: "Images by Europeana on unsplash - https://unsplash.com/fr/@europeana",
    url: "https://images.unsplash.com/photo-1748287443626-872bd20346e8?w=600&h=600&fit=crop"
}, {
    name: "Images by Europeana on unsplash - https://unsplash.com/fr/@europeana",
    url: "https://images.unsplash.com/photo-1748287443710-54d45b1a7545?w=600&h=600&fit=crop"
}, {
    name: "Images by Europeana on unsplash - https://unsplash.com/fr/@europeana",
    url: "https://images.unsplash.com/photo-1745175129822-f4eab6fc7327?w=600&h=600&fit=crop"
}];
let currentImageUrl = unsplashImages[0].url;
let panelVisible = !0;
toggleBtn.addEventListener('click', () => {
    panelVisible = !panelVisible;
    if (panelVisible) {
        controlsPanel.classList.remove('hidden');
        toggleBtn.classList.remove('panel-hidden');
        toggleBtn.classList.add('panel-visible')
    } else {
        controlsPanel.classList.add('hidden');
        toggleBtn.classList.remove('panel-visible');
        toggleBtn.classList.add('panel-hidden')
    }
});
creerPieces(currentImageUrl);
setTimeout(() => {
    melangerPieces()
}, 500);

function remplirMenuContextuel() {
    menuGrid.innerHTML = '';
    unsplashImages.forEach((image) => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `<img src="${image.url}" alt="${image.name}" title="${image.name}">`;
        div.addEventListener('click', () => {
            currentImageUrl = image.url;
            creerPieces(currentImageUrl);
            fermerMenuContextuel();
            setTimeout(() => {
                melangerPieces()
            }, 500)
        });
        menuGrid.appendChild(div)
    })
}

function ouvrirMenuContextuel(event) {
    event.preventDefault();
    remplirMenuContextuel();
    const rect = unsplashBtn.getBoundingClientRect();
    contextMenu.style.display = 'block';
    contextMenu.style.left = rect.left + 'px';
    contextMenu.style.top = (rect.top - contextMenu.offsetHeight - 5) + 'px';
    const menuRect = contextMenu.getBoundingClientRect();
    if (menuRect.top < 0) {
        contextMenu.style.top = (rect.bottom + 5) + 'px'
    }
}

function fermerMenuContextuel() {
    contextMenu.style.display = 'none'
}
unsplashBtn.addEventListener('click', (e) => {
    ouvrirMenuContextuel(e)
});
unsplashBtn.addEventListener('contextmenu', (e) => {
    ouvrirMenuContextuel(e)
});
document.addEventListener('click', (e) => {
    if (!unsplashBtn.contains(e.target) && !contextMenu.contains(e.target)) {
        fermerMenuContextuel()
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fermerMenuContextuel()
    }
});
document.getElementById("helpBtn").addEventListener("click", openHelpModal);
document.getElementById("helpModal").addEventListener("click", (e) => {
    if (e.target.id === "helpModal") {
        closeHelpModal()
    }
});
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');
            const ratio = Math.max(600 / img.width, 600 / img.height);
            const x = (600 - img.width * ratio) / 2;
            const y = (600 - img.height * ratio) / 2;
            ctx.drawImage(img, 0, 0, img.width, img.height, x, y, img.width * ratio, img.height * ratio);
            currentImageUrl = canvas.toDataURL('image/jpeg');
            creerPieces(currentImageUrl);
            setTimeout(() => {
                melangerPieces()
            }, 500)
        };
        img.src = event.target.result
    };
    reader.readAsDataURL(file)
});

function openHelpModal() {
    const modal = document.getElementById("helpModal");
    modal.classList.add("active")
}

function closeHelpModal() {
    const modal = document.getElementById("helpModal");
    modal.classList.remove("active")
}

function scrollToLanguage(lang) {
    const element = document.getElementById("lang-" + lang);
    if (element) {
        const content = document.getElementById("helpContent");
        content.scrollTo({
            top: element.offsetTop - content.offsetTop - 20,
            behavior: "smooth"
        });
        document.querySelectorAll(".flag-btn").forEach((btn) => {
            btn.classList.remove("active")
        });
        event.target.classList.add("active")
    }
}

function creerPieces(imageUrl) {
    container.innerHTML = '';
    pieces = [];
    for (let i = 0; i < 9; i++) {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        const ligne = Math.floor(i / 3);
        const colonne = i % 3;
        piece.style.backgroundImage = `url('${imageUrl}')`;
        piece.style.backgroundPosition = `-${colonne * taillePiece}px -${ligne * taillePiece}px`;
        piece.style.backgroundSize = '600px 600px';
        piece.dataset.index = i;
        piece.dataset.ligne = ligne;
        piece.dataset.colonne = colonne;
        piece.draggable = !1;
        piece.addEventListener('mousedown', handleDragStart);
        piece.addEventListener('dragstart', (e) => e.preventDefault());
        container.appendChild(piece);
        pieces.push(piece)
    }
}

function handleDragStart(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    draggedPiece = this;
    originalSlot = this;
    const rect = this.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    startX = e.clientX;
    startY = e.clientY;
    dragClone = this.cloneNode(!0);
    dragClone.style.position = 'fixed';
    dragClone.style.left = (e.clientX - dragOffsetX) + 'px';
    dragClone.style.top = (e.clientY - dragOffsetY) + 'px';
    dragClone.style.width = taillePiece + 'px';
    dragClone.style.height = taillePiece + 'px';
    dragClone.style.zIndex = '10000';
    dragClone.style.opacity = '0.9';
    dragClone.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    dragClone.style.cursor = 'grabbing';
    dragClone.style.pointerEvents = 'none';
    dragClone.id = 'dragging-clone';
    dragClone.style.border = '3px solid #4CAF50';
    dragClone.style.transform = 'scale(1.02)';
    document.body.appendChild(dragClone);
    this.classList.add('dragging-source');
    this.style.opacity = '0.5';
    isDragging = !0;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd)
}

function handleDragMove(e) {
    if (!isDragging || !dragClone || !draggedPiece) return;
    e.preventDefault();
    dragClone.style.left = (e.clientX - dragOffsetX) + 'px';
    dragClone.style.top = (e.clientY - dragOffsetY) + 'px';
    const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
    const pieceUnderMouse = elementsUnderMouse.find(el => el.classList.contains('puzzle-piece') && el !== draggedPiece);
    pieces.forEach(p => {
        p.classList.remove('drag-over');
        p.style.transform = '';
        p.style.border = ''
    });
    if (pieceUnderMouse) {
        pieceUnderMouse.classList.add('drag-over');
        const rect = pieceUnderMouse.getBoundingClientRect();
        const mouseX = e.clientX;
        const centerX = rect.left + rect.width / 2;
        if (mouseX < centerX) {
            pieceUnderMouse.style.borderLeft = '5px solid #4CAF50'
        } else {
            pieceUnderMouse.style.borderRight = '5px solid #4CAF50'
        }
    }
}

function handleDragEnd(e) {
    if (!isDragging || !draggedPiece) {
        cleanupDrag();
        return
    }
    e.preventDefault();
    const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
    const targetPiece = elementsUnderMouse.find(el => el.classList.contains('puzzle-piece') && el !== draggedPiece);
    if (targetPiece) {
        const rect = targetPiece.getBoundingClientRect();
        const mouseX = e.clientX;
        const centerX = rect.left + rect.width / 2;
        if (mouseX < centerX) {
            targetPiece.before(draggedPiece)
        } else {
            targetPiece.after(draggedPiece)
        }
        pieces = Array.from(container.children);
        verifierPuzzleResolu()
    }
    cleanupDrag()
}

function cleanupDrag() {
    if (dragClone && dragClone.parentNode) {
        dragClone.parentNode.removeChild(dragClone);
        dragClone = null
    }
    if (draggedPiece) {
        draggedPiece.classList.remove('dragging-source');
        draggedPiece.style.opacity = ''
    }
    pieces.forEach(p => {
        p.classList.remove('drag-over');
        p.style.transform = '';
        p.style.border = '';
        p.style.borderLeft = '';
        p.style.borderRight = ''
    });
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    isDragging = !1;
    draggedPiece = null;
    originalSlot = null;
    dragClone = null
}

function melangerPieces() {
    const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    const parent = container;
    const premierElement = pieces[indices[0]];
    if (parent.firstChild !== premierElement) {
        parent.insertBefore(premierElement, parent.firstChild)
    }
    for (let i = 1; i < indices.length; i++) {
        const piecePrecedente = pieces[indices[i - 1]];
        const pieceCourante = pieces[indices[i]];
        piecePrecedente.after(pieceCourante)
    }
    pieces = Array.from(container.children);
    pieces.forEach(p => {
        p.classList.remove('empty-slot', 'dragging', 'dragging-source', 'drag-over');
        p.style.opacity = '';
        p.style.transform = '';
        p.style.border = ''
    })
}

function afficherSolution() {
    for (let i = 0; i < pieces.length; i++) {
        const pieceCorrecte = pieces.find(p => parseInt(p.dataset.index) === i);
        if (pieceCorrecte && container.children[i] !== pieceCorrecte) {
            if (i === 0) {
                container.insertBefore(pieceCorrecte, container.firstChild)
            } else {
                container.children[i - 1].after(pieceCorrecte)
            }
        }
    }
    pieces = Array.from(container.children);
    pieces.forEach(p => {
        p.classList.remove('empty-slot', 'dragging', 'dragging-source', 'drag-over');
        p.style.opacity = '';
        p.style.transform = '';
        p.style.border = ''
    });
    setTimeout(() => {
        alert('Félicitations ! Puzzle résolu !')
    }, 100)
}

function verifierPuzzleResolu() {
    let estResolu = !0;
    for (let i = 0; i < pieces.length; i++) {
        if (parseInt(pieces[i].dataset.index) !== i) {
            estResolu = !1;
            break
        }
    }
    if (estResolu) {
        pieces.forEach(p => {
            p.style.transition = 'all 0.3s ease';
            p.style.transform = 'scale(1.02)';
            p.style.boxShadow = '0 0 20px #4CAF50'
        });
        setTimeout(() => {
            alert('🎉 Félicitations ! Puzzle résolu !');
            pieces.forEach(p => {
                p.style.transform = '';
                p.style.boxShadow = ''
            })
        }, 100)
    }
}
const style = document.createElement('style');
style.textContent = `
    .puzzle-piece {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        cursor: grab;
        transition: transform 0.2s, box-shadow 0.2s, border 0.2s;
        position: relative;
        border: 3px solid transparent;
        box-sizing: border-box;
    }
    
    .puzzle-piece:active {
        cursor: grabbing;
    }
    
    .puzzle-piece.dragging-source {
        opacity: 0.5;
        transform: scale(0.98);
    }
    
    .puzzle-piece.drag-over {
        transform: scale(1.02);
        box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
        border: 3px solid #4CAF50;
        z-index: 10;
    }
    
    #dragging-clone {
        pointer-events: none;
        transition: none;
        transform: rotate(2deg) scale(1.05);
        filter: brightness(1.1);
        border-radius: 8px;
        overflow: hidden;
    }
    
    /* Empêcher la sélection de texte pendant le drag */
    body.dragging-active {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
    }
`;
document.head.appendChild(style);
document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('puzzle-piece')) {
        e.preventDefault()
    }
})