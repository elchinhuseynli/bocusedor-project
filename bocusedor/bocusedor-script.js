// VaryLife Form JavaScript - International Phone Input Only
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initializePhoneInput();
  });

  function initializePhoneInput() {
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");

    if (!phoneInput) {
      console.error("Phone input not found");
      return;
    }

    // Initialize International Telephone Input
    let iti;
    try {
      iti = window.intlTelInput(phoneInput, {
        initialCountry: "cz",
        preferredCountries: ["cz", "sk", "de", "at"],
        utilsScript:
          "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js",
        formatOnDisplay: true,
        separateDialCode: false,
        nationalMode: false,
        customPlaceholder: function (
          selectedCountryPlaceholder,
          selectedCountryData
        ) {
          return "např. " + selectedCountryPlaceholder;
        },
      });

      console.log("International phone input initialized successfully");
    } catch (error) {
      console.error("Failed to initialize intl-tel-input:", error);
    }

    // Add stricter email validation
    if (emailInput) {
      emailInput.addEventListener("input", function () {
        const email = this.value.trim();
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (email && !emailPattern.test(email)) {
          this.setCustomValidity(
            "Zadejte platnou e-mailovou adresu s doménou (např. jmeno@example.com)"
          );
        } else {
          this.setCustomValidity("");
        }
      });
    }

    // Update phone number to international format before form submission
    const form = document.querySelector("form");
    if (form && iti) {
      form.addEventListener("submit", function (event) {
        try {
          // Always try to get the full international number
          const fullNumber = iti.getNumber();
          if (fullNumber) {
            phoneInput.value = fullNumber;
            console.log(
              "Phone number updated to international format:",
              fullNumber
            );
          } else {
            // Fallback: if no full number, try to construct it manually
            const selectedCountryData = iti.getSelectedCountryData();
            const nationalNumber = phoneInput.value.trim();

            if (
              selectedCountryData &&
              selectedCountryData.dialCode &&
              nationalNumber
            ) {
              // Remove any existing country code and non-digits except spaces
              const cleanNumber = nationalNumber
                .replace(/^\+?(\d+\s?)*/, "")
                .trim();
              const internationalNumber =
                "+" + selectedCountryData.dialCode + " " + cleanNumber;
              phoneInput.value = internationalNumber;
              console.log(
                "Phone number manually formatted to:",
                internationalNumber
              );
            }
          }
        } catch (error) {
          console.error("Error formatting phone number:", error);

          // Last resort fallback
          const selectedCountryData = iti.getSelectedCountryData();
          const nationalNumber = phoneInput.value.trim();

          if (
            selectedCountryData &&
            selectedCountryData.dialCode &&
            nationalNumber
          ) {
            const cleanNumber = nationalNumber
              .replace(/^\+?(\d+\s?)*/, "")
              .replace(/\D/g, "");
            if (cleanNumber) {
              phoneInput.value =
                "+" +
                selectedCountryData.dialCode +
                " " +
                cleanNumber.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
              console.log(
                "Phone number fallback formatted to:",
                phoneInput.value
              );
            }
          }
        }
      });
    }
  }
})();
