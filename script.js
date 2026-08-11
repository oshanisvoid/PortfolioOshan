
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const navLinksContainer = document.querySelector(".nav-links-container");

  if (hamburger && navLinksContainer) {
    hamburger.addEventListener("click", () => {
      const active = navLinksContainer.classList.toggle("active");
      hamburger.setAttribute("aria-expanded", String(active));
      const icon = hamburger.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars", !active);
        icon.classList.toggle("fa-times", active);
      }
    });

    navLinksContainer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinksContainer.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
        const icon = hamburger.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-times");
          icon.classList.add("fa-bars");
        }
      });
    });
  }

  const contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = document.querySelector("#contact-status");
      const submit = document.querySelector("#contact-submit");

      status.className = "form-status";
      status.textContent = "Sending...";
      submit.disabled = true;

      try {
        const formData = new URLSearchParams();
        new FormData(contactForm).forEach((value, key) => formData.append(key, value));

        const response = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString()
        });

        if (!response.ok) throw new Error("Unable to submit the form.");

        contactForm.reset();
        status.className = "form-status success";
        status.textContent = "Thanks — your message has been sent.";
      } catch (error) {
        status.className = "form-status error";
        status.textContent = "Something went wrong. Please email me directly instead.";
      } finally {
        submit.disabled = false;
      }
    });
  }


});
