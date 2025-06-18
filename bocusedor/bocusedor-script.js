// VaryLife Form JavaScript - International Phone Input Only
(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    initialCountry: "cz",
    preferredCountries: ["cz", "sk", "de", "at"],
    utilsScript:
      "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js",
    emailPattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  };

  // Utility functions
  const utils = {
    /**
     * Clean phone number by removing non-digits and spaces
     * @param {string} number - The phone number to clean
     * @returns {string} - Cleaned phone number
     */
    cleanPhoneNumber: function (number) {
      return number.replace(/\D/g, "").replace(/\s/g, "");
    },

    /**
     * Remove country code from phone number
     * @param {string} number - The phone number
     * @returns {string} - Phone number without country code
     */
    removeCountryCode: function (number) {
      return number.replace(/^\+?(\d+\s?)*/, "").trim();
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid
     */
    isValidEmail: function (email) {
      return CONFIG.emailPattern.test(email.trim());
    },

    /**
     * Log message with timestamp
     * @param {string} message - Message to log
     * @param {string} type - Log type (log, error, warn)
     */
    log: function (message, type = "log") {
      const timestamp = new Date().toISOString();
      console[type](`[${timestamp}] ${message}`);
    },
  };

  // Phone input manager
  const PhoneInputManager = {
    iti: null,
    phoneInput: null,
    countryCodeInput: null,

    /**
     * Initialize the phone input
     */
    init: function () {
      this.phoneInput = document.getElementById("phone");
      this.countryCodeInput = document.getElementById("country_code");

      if (!this.phoneInput) {
        utils.log("Phone input not found", "error");
        return false;
      }

      try {
        this.initializeIntlTelInput();
        this.setupEventListeners();
        this.setInitialCountryCode();
        utils.log("Phone input initialized successfully");
        return true;
      } catch (error) {
        utils.log(
          `Failed to initialize phone input: ${error.message}`,
          "error"
        );
        return false;
      }
    },

    /**
     * Initialize International Telephone Input
     */
    initializeIntlTelInput: function () {
      this.iti = window.intlTelInput(this.phoneInput, {
        initialCountry: CONFIG.initialCountry,
        preferredCountries: CONFIG.preferredCountries,
        utilsScript: CONFIG.utilsScript,
        formatOnDisplay: false,
        separateDialCode: false,
        nationalMode: true,
        customPlaceholder: function (
          selectedCountryPlaceholder,
          selectedCountryData
        ) {
          return "např. " + selectedCountryPlaceholder;
        },
      });
    },

    /**
     * Setup event listeners
     */
    setupEventListeners: function () {
      // Country change event
      this.phoneInput.addEventListener("countrychange", () => {
        this.updateCountryCode();
      });

      // Clean phone number as user types to prevent formatting
      this.phoneInput.addEventListener("input", (e) => {
        // Get the raw value without any formatting
        const rawValue = e.target.value;

        // Only allow digits
        const digitsOnly = rawValue.replace(/\D/g, "");

        // If the value changed due to formatting, update it
        if (rawValue !== digitsOnly) {
          e.target.value = digitsOnly;
        }
      });
    },

    /**
     * Set initial country code
     */
    setInitialCountryCode: function () {
      const countryData = this.iti.getSelectedCountryData();
      if (countryData?.iso2 && this.countryCodeInput) {
        this.countryCodeInput.value = countryData.iso2.toUpperCase();
      }
    },

    /**
     * Update country code when country changes
     */
    updateCountryCode: function () {
      const countryData = this.iti.getSelectedCountryData();
      if (countryData?.iso2 && this.countryCodeInput) {
        this.countryCodeInput.value = countryData.iso2.toUpperCase();
        utils.log(`Country code updated to: ${countryData.iso2.toUpperCase()}`);
      }
    },

    /**
     * Format phone number to national format
     */
    formatPhoneNumber: function () {
      try {
        // Get the raw input value and clean it completely
        const rawValue = this.phoneInput.value;
        const cleanNumber = this.extractNationalNumber(rawValue);

        if (cleanNumber) {
          this.phoneInput.value = cleanNumber;
          utils.log(`Phone number formatted to national: ${cleanNumber}`);
          return true;
        }

        // Fallback: try library method
        const nationalNumber = this.iti.getNumber(
          intlTelInputUtils.numberType.NATIONAL
        );
        if (nationalNumber) {
          const cleanNationalNumber = utils.cleanPhoneNumber(nationalNumber);
          this.phoneInput.value = cleanNationalNumber;
          utils.log(
            `Phone number formatted via library: ${cleanNationalNumber}`
          );
          return true;
        }

        return false;
      } catch (error) {
        utils.log(`Error formatting phone number: ${error.message}`, "error");
        return this.formatPhoneNumberFallback();
      }
    },

    /**
     * Extract national number from input value
     */
    extractNationalNumber: function (inputValue) {
      if (!inputValue) return null;

      // Remove all non-digit characters
      let cleanNumber = inputValue.replace(/\D/g, "");

      // Get selected country data
      const countryData = this.iti.getSelectedCountryData();
      if (countryData && countryData.dialCode) {
        const dialCode = countryData.dialCode.replace(/\D/g, "");

        // If the number starts with the country code, remove it
        if (cleanNumber.startsWith(dialCode)) {
          cleanNumber = cleanNumber.substring(dialCode.length);
        }

        // Also check for common variations
        const variations = ["+" + dialCode, "00" + dialCode, dialCode];

        for (const variation of variations) {
          if (cleanNumber.startsWith(variation.replace(/\D/g, ""))) {
            cleanNumber = cleanNumber.substring(
              variation.replace(/\D/g, "").length
            );
            break;
          }
        }
      }

      return cleanNumber || null;
    },

    /**
     * Fallback phone number formatting
     */
    formatPhoneNumberFallback: function () {
      const currentValue = this.phoneInput.value.trim();

      if (!currentValue) {
        return false;
      }

      // Use the same extraction method for consistency
      const cleanNumber = this.extractNationalNumber(currentValue);

      if (cleanNumber) {
        this.phoneInput.value = cleanNumber;
        utils.log(
          `Phone number fallback formatted to national: ${cleanNumber}`
        );
        return true;
      }

      return false;
    },
  };

  // Email validation manager
  const EmailValidationManager = {
    emailInput: null,

    /**
     * Initialize email validation
     */
    init: function () {
      this.emailInput = document.getElementById("email");

      if (!this.emailInput) {
        return false;
      }

      this.setupValidation();
      return true;
    },

    /**
     * Setup email validation
     */
    setupValidation: function () {
      this.emailInput.addEventListener("input", () => {
        this.validateEmail();
      });
    },

    /**
     * Validate email input
     */
    validateEmail: function () {
      const email = this.emailInput.value.trim();

      if (email && !utils.isValidEmail(email)) {
        this.emailInput.setCustomValidity(
          "Zadejte platnou e-mailovou adresu s doménou (např. jmeno@example.com)"
        );
      } else {
        this.emailInput.setCustomValidity("");
      }
    },
  };

  // Form manager
  const FormManager = {
    form: null,

    /**
     * Initialize form handling
     */
    init: function () {
      this.form = document.querySelector("form");

      if (!this.form) {
        utils.log("Form not found", "error");
        return false;
      }

      this.setupFormSubmission();
      return true;
    },

    /**
     * Setup form submission handler
     */
    setupFormSubmission: function () {
      this.form.addEventListener("submit", (event) => {
        this.handleFormSubmission(event);
      });
    },

    /**
     * Handle form submission
     */
    handleFormSubmission: function (event) {
      // Format phone number before submission
      if (PhoneInputManager.iti) {
        // Force clean the phone number immediately
        const phoneInput = document.getElementById("phone");
        if (phoneInput) {
          // Remove ALL non-digit characters including spaces
          const rawValue = phoneInput.value;
          const cleanNumber = rawValue.replace(/\D/g, "");

          // Remove country code if present
          const countryData = PhoneInputManager.iti.getSelectedCountryData();
          if (countryData && countryData.dialCode) {
            const dialCode = countryData.dialCode.replace(/\D/g, "");
            if (cleanNumber.startsWith(dialCode)) {
              phoneInput.value = cleanNumber.substring(dialCode.length);
            } else {
              phoneInput.value = cleanNumber;
            }
          } else {
            phoneInput.value = cleanNumber;
          }

          utils.log(`Form submission: Phone cleaned to: ${phoneInput.value}`);
        }
      }
    },
  };

  // Main initialization
  document.addEventListener("DOMContentLoaded", function () {
    utils.log("Initializing VaryLife form...");

    // Initialize all managers
    const phoneInitialized = PhoneInputManager.init();
    const emailInitialized = EmailValidationManager.init();
    const formInitialized = FormManager.init();

    if (phoneInitialized && emailInitialized && formInitialized) {
      utils.log("VaryLife form initialized successfully");
    } else {
      utils.log("Some components failed to initialize", "warn");
    }
  });
})();
