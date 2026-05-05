// Video kalitesi seçimi ve Başlatma Mantığı
(function() {
  var video = document.getElementById('arkaplan-video');
  var source = document.getElementById('video-source');
  var high = '/video/animasyon1920.mp4';
  var low = '/video/animasyon.mp4';
  var useHigh = window.innerWidth > 1200 && window.devicePixelRatio > 1;
  var selected = useHigh ? high : low;
  
  if (source.getAttribute('src') !== selected) {
    source.setAttribute('src', selected);
    video.load();
  }

  var introStarted = false;

  // URL kontrolü - Eğer ?section=projects varsa direkt dashboard'u aç
  const urlParams = new URLSearchParams(window.location.search);
  
  // Eğer sunucudan activeProjectId geldiyse (index.ejs içinde tanımlı global değişken)
  if (typeof activeProjectId !== 'undefined' && activeProjectId !== null) {
    introStarted = true;
    
    // Dashboard'u aç
    document.getElementById('dashboard').classList.add('active');
    document.body.classList.add('dashboard-active');
    document.getElementById('arkaplan-video').classList.add('video-blur');
    
    // Intro elementlerini gizle
    document.getElementById("title").style.display = 'none';
    document.getElementById("subtitle").style.display = 'none';
    document.querySelector('.discover-wrapper').style.display = 'none';

    // Detay sayfasını aç
    if (typeof openProjectDetail === 'function') {
      openProjectDetail(activeProjectId);
    }
  } 
  else if (urlParams.get('section') === 'projects') {
    introStarted = true; // Intro'nun otomatik başlamasını engelle
    
    // Dashboard'u aç
    document.getElementById('dashboard').classList.add('active');
    document.body.classList.add('dashboard-active');
    document.getElementById('arkaplan-video').classList.add('video-blur');
    
    // Intro elementlerini gizle
    document.getElementById("title").style.display = 'none';
    document.getElementById("subtitle").style.display = 'none';
    document.querySelector('.discover-wrapper').style.display = 'none';
  }

  function startIntro() {
    if (introStarted) return;
    introStarted = true;
    setTimeout(runIntro, 500);
  }

  // Video başladığında
  video.addEventListener('play', startIntro);

  // Manuel başlatma denemesi (Opera vb. için)
  var playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log("Otomatik oynatma engellendi, intro yine de başlatılıyor.");
      startIntro();
    });
  }

  // KULLANICI ETKİLEŞİMİ İLE ZORLA BAŞLATMA (Mobil Tarayıcılar İçin Kesin Çözüm)
  function forcePlay() {
    if (video.paused) {
      video.play().then(() => {
        // Video başladıysa bu dinleyiciyi kaldır
        document.removeEventListener('touchstart', forcePlay);
        document.removeEventListener('click', forcePlay);
      }).catch(e => console.log("Hala başlatılamadı"));
    }
  }
  
  document.addEventListener('touchstart', forcePlay, { passive: true });
  document.addEventListener('click', forcePlay);

  // Her ihtimale karşı zaman aşımı (Video hiç başlamazsa bile site açılsın)
  setTimeout(startIntro, 2000);
})();

// Geri Butonu Dinleyicisi (Global)
document.getElementById('back-btn').addEventListener('click', () => {
    const dashboard = document.getElementById('dashboard');
    const video = document.getElementById('arkaplan-video');

    // Dashboard'u gizle
    dashboard.classList.remove('active');
    document.body.classList.remove('dashboard-active');
    
    // Videoyu netleştir
    video.classList.remove('video-blur');

    // Gizlenen elementleri tekrar görünür yap (Eğer ?section=projects ile gelindiyse)
    document.getElementById("title").style.display = '';
    document.getElementById("subtitle").style.display = '';
    document.querySelector('.discover-wrapper').style.display = '';

    // Dashboard kapandıktan sonra introyu baştan oynat
    setTimeout(() => {
        runIntro();
    }, 500);
});

// Giriş Animasyonu (Chaos -> Order)
function runIntro() {
    const titleContainer = document.getElementById("title");
    const subtitleContainer = document.getElementById("subtitle");
    const discoverBtn = document.getElementById("discover-btn");
    const stars = document.querySelectorAll('.star');
    const border = document.querySelector('.button-border');
    const wrapper = document.querySelector('.discover-wrapper');

    // Temizlik (Reset)
    titleContainer.innerHTML = '';
    subtitleContainer.innerHTML = '';
    discoverBtn.innerHTML = '';
    
    // Sınıfları sıfırla
    titleContainer.className = 'container initial';
    subtitleContainer.className = 'container initial';
    discoverBtn.className = 'container';
    wrapper.classList.remove('warp-out'); // Warp efektini kaldır
    
    stars.forEach(s => s.classList.remove('active'));
    border.classList.remove('active');

    // Animasyon Sayacı
    let animationsCompleted = 0;
    const onBothAnimationsComplete = () => {
      animationsCompleted++;
      if (animationsCompleted === 2) {
        requestAnimationFrame(() => {
          titleContainer.classList.add('shrinked');
          subtitleContainer.classList.add('shrinked');
          
          requestAnimationFrame(() => {
            titleContainer.classList.remove('initial');
            subtitleContainer.classList.remove('initial');
          });
        });
      }
    };

    // Dil kontrolü
    const lang = localStorage.getItem('lang') || 'en';
    const t = translations[lang] || translations['en'];

    // Metinleri Başlat
    createAnimatedText("title", t.intro_title, onBothAnimationsComplete);
    createAnimatedText("subtitle", t.intro_subtitle, onBothAnimationsComplete);

    // Buton Animasyonu
    setTimeout(() => {
      discoverBtn.classList.add('initial');
      
      stars.forEach((star, index) => {
        setTimeout(() => star.classList.add('active'), index * 200);
      });

      setTimeout(() => border.classList.add('active'), 1500);

      setTimeout(() => {
        // Tıklama olayını animasyonun bitmesini beklemeden tanımla
        discoverBtn.onclick = () => {
            runOutro(() => {
                document.getElementById('dashboard').classList.add('active');
                document.body.classList.add('dashboard-active');
                document.getElementById('arkaplan-video').classList.add('video-blur');
            });
        };

        createAnimatedText("discover-btn", t.discover, () => {
          discoverBtn.style.transition = "all 0.3s ease";
        });
      }, 1000);
    }, 800);
}

// Çıkış Animasyonu (Order -> Chaos)
function runOutro(callback) {
    // Ekrandaki tüm karakterleri seç
    const chars = document.querySelectorAll('.char');
    const radius = Math.max(window.innerWidth, window.innerHeight);
    
    chars.forEach(char => {
        // Rastgele bir yöne fırlat
        const angle = Math.random() * Math.PI * 2;
        const destX = Math.cos(angle) * radius;
        const destY = Math.sin(angle) * radius;
        
        // Hızlanarak git (ease-in)
        char.style.transition = 'transform 0.8s cubic-bezier(0.55, 0.055, 0.675, 0.19), opacity 0.8s';
        char.style.transform = `translate(${destX}px, ${destY}px)`;
        char.style.opacity = '0';
    });

    // Yıldızları ve butonu da yok et
    document.querySelector('.discover-wrapper').classList.add('warp-out');
    
    // Animasyon bitince callback çalıştır
    setTimeout(callback, 800);
}

// Yardımcı Fonksiyon: Metin Oluşturucu
function createAnimatedText(elementId, text, callback) {
  const container = document.getElementById(elementId);
  container.innerHTML = '';
  const totalDuration = 2000;
  const chars = text.split('');
  const midPoint = Math.floor(chars.length / 2);
  
  const fragment = document.createDocumentFragment();
  const elements = [];

  chars.forEach((char) => {
    const span = document.createElement('span');
    span.classList.add('char');
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.opacity = '0';
    
    const radius = Math.max(window.innerWidth, window.innerHeight);
    const angle = Math.random() * Math.PI * 2;
    
    const startX = Math.cos(angle) * radius;
    const startY = Math.sin(angle) * radius;
    
    span.style.transform = `translate(${startX}px, ${startY}px)`;
    span.style.willChange = 'transform, opacity'; // Performance hint
    
    fragment.appendChild(span);
    elements.push(span);
  });

  container.appendChild(fragment);

  requestAnimationFrame(() => {
    elements.forEach((span, index) => {
      let startDelay;
      if (index < midPoint) {
        startDelay = (index / midPoint) * (totalDuration * 0.666);
      } else {
        const firstPartDuration = totalDuration * 0.666;
        startDelay = firstPartDuration + ((index - midPoint) / (chars.length - midPoint)) * (totalDuration * 0.334);
      }
      setTimeout(() => {
        span.style.transition = `transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.7s`;
        span.style.transform = 'translate(0, 0)';
        span.style.opacity = '1';
        if (index === elements.length - 1) {
          setTimeout(() => {
            // Clean up will-change to save memory
            elements.forEach(el => el.style.willChange = 'auto');
            if (callback) callback();
          }, 700);
        }
      }, startDelay);
    });
  });
}
