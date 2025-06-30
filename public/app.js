document.addEventListener('DOMContentLoaded', () => {

    // --- Variables Globales y Estado ---
    const sections = document.querySelectorAll('.content-section');
    const navButtons = document.querySelectorAll('nav button');
    let moodChart = null;

    // --- Lógica de Navegación ---
    const switchTab = (targetId) => {
        sections.forEach(section => {
            section.classList.toggle('active', section.id === targetId);
        });
        navButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.target === targetId);
        });
    };

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.target);
        });
    });

    // --- Lógica del Diario Emocional ---
    const moodEmojis = document.querySelectorAll('.mood-emoji');
    const emotionScoreInput = document.getElementById('emotion-score');
    const thoughtsTextInput = document.getElementById('thoughts-text');
    const saveEntryButton = document.getElementById('save-entry');
    const historyList = document.getElementById('history-list');
    const feedbackMessage = document.getElementById('feedback-message');

    moodEmojis.forEach(emoji => {
        emoji.addEventListener('click', () => {
            moodEmojis.forEach(e => e.classList.remove('selected'));
            emoji.classList.add('selected');
            emotionScoreInput.value = emoji.dataset.value;
        });
    });

    const fetchAndRenderEntries = async () => {
        try {
            const response = await fetch('/api/entries');
            if (!response.ok) throw new Error('Error al cargar las entradas');
            const entries = await response.json();
            renderHistory(entries);
            renderChart(entries);
        } catch (error) {
            console.error(error);
            historyList.innerHTML = `<p>Error al cargar el historial.</p>`;
        }
    };
    
    const renderHistory = (entries) => {
        if (entries.length === 0) {
            historyList.innerHTML = `<p>Aún no hay entradas. ¡Anímate a registrar tu primera emoción!</p>`;
            return;
        }
        historyList.innerHTML = entries.map(entry => {
            const date = new Date(entry.entry_date).toLocaleString('es-ES', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const emojiMap = {1: '😞', 2: '😐', 3: '🙂', 4: '�', 5: '😁'};

            return `
                <div class="entry">
                    <div class="entry-header">
                        <span>${emojiMap[entry.emotion_score] || '❓'} - Estado de ánimo: ${entry.emotion_score}/5</span>
                        <span class="entry-date">${date}</span>
                    </div>
                    ${entry.thoughts_text ? `<p class="entry-thoughts">${entry.thoughts_text}</p>` : ''}
                </div>
            `;
        }).join('');
    };
    
    const renderChart = (entries) => {
        const ctx = document.getElementById('mood-chart').getContext('2d');
        if (entries.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Limpiar si no hay datos
            return;
        }

        const labels = entries.map(e => new Date(e.entry_date).toLocaleDateString('es-ES')).reverse();
        const data = entries.map(e => e.emotion_score).reverse();

        if (moodChart) {
            moodChart.destroy();
        }

        moodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Estado de Ánimo',
                    data: data,
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        min: 1,
                        ticks: {
                           stepSize: 1
                        }
                    }
                }
            }
        });
    };

    saveEntryButton.addEventListener('click', async () => {
        const emotion_score = emotionScoreInput.value;
        const thoughts_text = thoughtsTextInput.value.trim();

        if (!emotion_score) {
            feedbackMessage.textContent = 'Por favor, selecciona un estado de ánimo.';
            feedbackMessage.style.color = 'red';
            return;
        }

        try {
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emotion_score, thoughts_text })
            });

            if (!response.ok) throw new Error('Error al guardar.');

            feedbackMessage.textContent = '¡Entrada guardada con éxito!';
            feedbackMessage.style.color = 'green';
            
            // Limpiar formulario
            thoughtsTextInput.value = '';
            emotionScoreInput.value = '';
            moodEmojis.forEach(e => e.classList.remove('selected'));
            
            setTimeout(() => { feedbackMessage.textContent = ''; }, 3000);
            
            fetchAndRenderEntries();

        } catch (error) {
            console.error(error);
            feedbackMessage.textContent = 'Hubo un error al guardar. Inténtalo de nuevo.';
            feedbackMessage.style.color = 'red';
        }
    });

    // --- Lógica de Respiración ---
    const breathingInstruction = document.getElementById('breathing-instruction');
    const breathingCircle = document.getElementById('breathing-circle');
    const startBtn = document.getElementById('start-breathing');
    const stopBtn = document.getElementById('stop-breathing');
    const quickStressBtn = document.getElementById('quick-stress-release');
    const audio = document.getElementById('breathing-audio');
    let breathingInterval = null;

    const startBreathingCycle = () => {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        
        const cycle = () => {
            // Inhalar (4s)
            breathingInstruction.textContent = 'Inhala profundamente... (4s)';
            breathingCircle.style.transform = 'scale(1.8)';
            breathingCircle.style.transitionDuration = '4s';

            // Sostener (7s)
            setTimeout(() => {
                breathingInstruction.textContent = 'Sostén la respiración... (7s)';
                 // No hay cambio visual
            }, 4000);

            // Exhalar (8s)
            setTimeout(() => {
                breathingInstruction.textContent = 'Exhala lentamente... (8s)';
                breathingCircle.style.transform = 'scale(1)';
                breathingCircle.style.transitionDuration = '8s';
            }, 4000 + 7000);
        };
        
        cycle(); // Iniciar inmediatamente
        breathingInterval = setInterval(cycle, 4000 + 7000 + 8000); // Repetir cada 19s
        
        // NOTA: La reproducción de audio es opcional. Descomenta si tienes un archivo.
        // audio.play().catch(e => console.log("El usuario debe interactuar con la página primero para reproducir audio."));
    };
    
    const stopBreathingCycle = () => {
        clearInterval(breathingInterval);
        breathingInterval = null;
        breathingInstruction.textContent = 'Presiona "Iniciar" para comenzar el ejercicio.';
        breathingCircle.style.transform = 'scale(1)';
        breathingCircle.style.transitionDuration = '1s';
        startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
        audio.pause();
        audio.currentTime = 0;
    };
    
    startBtn.addEventListener('click', startBreathingCycle);
    stopBtn.addEventListener('click', stopBreathingCycle);
    quickStressBtn.addEventListener('click', () => {
        switchTab('respirar');
        if (!breathingInterval) {
            startBreathingCycle();
        }
    });


    // --- Inicialización ---
    switchTab('diario'); // Mostrar la pestaña del diario al cargar
    fetchAndRenderEntries(); // Cargar historial inicial

});
