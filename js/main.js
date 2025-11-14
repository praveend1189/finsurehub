// ----- TYPING EFFECT -----
const typed = new Typed('.typedText', {
    strings: ['Finsure Hub'],
    typeSpeed: 100,
    backSpeed: 80,
    backDelay: 2000,
    loop: false,
    showCursor: false // Add this line to remove the blinking cursor
});

// ----- NAVIGATION MENU -----
function myMenuFunction() {
    var menuBtn = document.getElementById("myNavMenu");
    if(menuBtn.className === "nav-menu") {
        menuBtn.className += " responsive";
    } else {
        menuBtn.className = "nav-menu";
    }
}

// ----- ADD SHADOW ON NAVIGATION BAR WHILE SCROLLING -----
window.onscroll = function() {headerShadow()};
function headerShadow() {
    const navHeader = document.getElementById("header");
    if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
        navHeader.style.boxShadow = "0 1px 6px rgba(0, 0, 0, 0.1)";
        navHeader.style.height = "70px";
        navHeader.style.lineHeight = "70px";
    } else {
        navHeader.style.boxShadow = "0 1px 6px rgba(0, 0, 0, 0.1)";
        navHeader.style.height = "90px";
        navHeader.style.lineHeight = "90px";
    }
}

// ----- SCROLL REVEAL ANIMATION -----
const sr = ScrollReveal({
    origin: 'top',
    distance: '80px',
    duration: 2000,
    reset: true
});

// Home
sr.reveal('.featured-text-card', {});
sr.reveal('.featured-name', {delay: 100});
sr.reveal('.featured-text-info', {delay: 200});
sr.reveal('.featured-images', {delay: 300});

// About
sr.reveal('.about-info', {delay: 400});
sr.reveal('.skills-box', {interval: 100});

// Services
sr.reveal('.project-box', {interval: 200});

// Contact
sr.reveal('.contact-info', {delay: 400});
sr.reveal('.form-control', {delay: 500});

//finsurehubcom@gmail.com
//PraveenDev123@

// ----- CLOSE NAVIGATION MENU WHEN LINK IS CLICKED (MOBILE) -----
const navLinks = document.querySelectorAll('.nav-menu a');
const navMenu = document.getElementById('myNavMenu');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu.classList.contains('responsive')) {
            navMenu.classList.remove('responsive');
        }
    });
});

// ----- CONTACT FORM SUBMISSION -----
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('form[name="contact"]');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.innerHTML = 'Sending... <i class="uil uil-spinner"></i>';
            submitBtn.disabled = true;
        });
    }
});