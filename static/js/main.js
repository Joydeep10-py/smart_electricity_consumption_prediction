/**
 * SPARK - Main App Controller
 * Theme switching (Dark/Light), Mobile drawer menu, Animated stat counters,
 * Active link styling, and Universal Toast notification system.
 */

(function() {
  // 1. Theme Switcher (Dark / Light)
  const savedTheme = localStorage.getItem('spark_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-toggle-icon');
    if (!icon) return;
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun';
      icon.parentElement.title = 'Switch to Light Mode';
    } else {
      icon.className = 'fa-solid fa-moon';
      icon.parentElement.title = 'Switch to Dark Mode';
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('spark_theme', next);
    updateThemeIcon(next);

    if (window.SPARK_CHARTS && typeof window.SPARK_CHARTS.refreshTheme === 'function') {
      window.SPARK_CHARTS.refreshTheme();
    }
  }

  // 2. Global Toast Notification System
  window.showToast = function(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'error') iconClass = 'fa-circle-xmark';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    // Fade out and remove
    const removeToast = () => {
      toast.classList.add('toast-fade');
      setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', removeToast);
    setTimeout(removeToast, 3500);
  };

  // 3. Animated Number Counters
  function initStatCounters() {
    const counters = document.querySelectorAll('.stat-counter');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-target')) || 0;
          const isDecimal = target % 1 !== 0;
          const duration = 1400; // ms
          const stepTime = 20;
          const steps = duration / stepTime;
          const increment = target / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            el.textContent = isDecimal ? current.toFixed(3) : Math.floor(current).toLocaleString('en-IN');
          }, stepTime);

          obs.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    counters.forEach(c => observer.observe(c));
  }

  // DOMContentLoaded setup
  document.addEventListener('DOMContentLoaded', function() {
    // Theme setup
    updateThemeIcon(document.documentElement.getAttribute('data-theme'));
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    // Mobile Navbar toggle
    const hamburgerBtn = document.getElementById('navbar-hamburger');
    const navLinks = document.getElementById('navbar-links');
    if (hamburgerBtn && navLinks) {
      hamburgerBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = hamburgerBtn.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-bars');
          icon.classList.toggle('fa-xmark');
        }
      });
    }

    // Active Link Highlight
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkPath = link.getAttribute('href').replace(/\/$/, '') || '/';
      if (linkPath === currentPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Initialize Counters
    initStatCounters();
  });
})();
