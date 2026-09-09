class OnboardingForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {
            fullName: '',
            email: '',
            phone: '',
            username: '',
            password: '',
            confirmPassword: ''
        };

        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadFormData();
        this.updateStepIndicator();
    }

    cacheDOM() {
        this.form = document.getElementById('onboardingForm');
        this.nextBtn = document.getElementById('nextBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.successModal = document.getElementById('successModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.stepItems = document.querySelectorAll('.step-item');
        this.stepLines = document.querySelectorAll('.step-line');
        this.formInputs = this.form.querySelectorAll('input');
    }

    bindEvents() {
        this.nextBtn.addEventListener('click', (e) => this.handleNextClick(e));
        this.prevBtn.addEventListener('click', (e) => this.handlePrevClick(e));
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.formInputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
        this.bindStepIndicators();
    }

    bindStepIndicators() {
        this.stepItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleStepIndicatorClick(e, item));
        });
    }

    handleStepIndicatorClick(e, stepItem) {
        e.preventDefault();
        const targetStep = parseInt(stepItem.getAttribute('data-step'));

        if (targetStep < this.currentStep) {
            this.goToStep(targetStep);
        } else if (targetStep === this.currentStep) {
            return;
        } else {
            this.showNavigationBlockedMessage(targetStep);
        }
    }

    showNavigationBlockedMessage(targetStep) {
        const message = document.createElement('div');
        message.className = 'navigation-blocked-message';
        message.setAttribute('role', 'alert');
        message.textContent = `Please complete the current step before proceeding to step ${targetStep}`;

        const formStep = document.querySelector('.form-step.active');
        formStep.parentNode.insertBefore(message, formStep);

        setTimeout(() => {
            message.classList.add('show');
        }, 10);

        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    handleNextClick(e) {
        e.preventDefault();

        if (!this.validateCurrentStep()) {
            return;
        }

        this.saveFormData();

        if (this.currentStep < this.totalSteps) {
            this.goToStep(this.currentStep + 1);
        } else if (this.currentStep === this.totalSteps) {
            this.completeOnboarding();
        }
    }

    handlePrevClick(e) {
        e.preventDefault();
        this.saveFormData();

        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    }

    goToStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > this.totalSteps) return;

        const currentStep = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        const nextStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);

        currentStep.classList.remove('active');
        nextStep.classList.add('active');

        this.currentStep = stepNumber;
        this.updateStepIndicator();
        this.updateButtonLabels();
        this.scrollToForm();

        if (this.currentStep === this.totalSteps) {
            this.populateSummary();
        }
    }

    updateStepIndicator() {
        this.stepItems.forEach((item, index) => {
            const stepNum = index + 1;
            item.classList.remove('active', 'completed');
            item.setAttribute('aria-selected', stepNum === this.currentStep ? 'true' : 'false');

            if (stepNum === this.currentStep) {
                item.classList.add('active');
                item.disabled = false;
            } else if (stepNum < this.currentStep) {
                item.classList.add('completed');
                item.disabled = false;
            } else {
                item.disabled = true;
            }
        });

        this.stepLines.forEach((line, index) => {
            line.classList.toggle('active', index < this.currentStep - 1);
        });

        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        this.prevBtn.disabled = this.currentStep === 1;
        this.prevBtn.style.opacity = this.currentStep === 1 ? '0.5' : '1';
        this.prevBtn.style.pointerEvents = this.currentStep === 1 ? 'none' : 'auto';
    }

    updateButtonLabels() {
        if (this.currentStep === this.totalSteps) {
            this.nextBtn.textContent = '✓ Complete';
        } else {
            this.nextBtn.textContent = 'Next';
        }
    }

    validateCurrentStep() {
        const currentFields = this.getFieldsForStep(this.currentStep);
        let isValid = true;

        currentFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    getFieldsForStep(step) {
        const fieldMap = {
            1: ['fullName', 'email', 'phone'],
            2: ['username', 'password', 'confirmPassword'],
            3: []
        };

        return fieldMap[step].map(name => this.form.elements[name]);
    }

    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        let error = '';

        if (!value) {
            error = 'This field is required';
        } else if (fieldName === 'email') {
            if (!this.isValidEmail(value)) {
                error = 'Please enter a valid email address';
            }
        } else if (fieldName === 'password') {
            if (value.length < 8) {
                error = 'Password must be at least 8 characters';
            }
        } else if (fieldName === 'confirmPassword') {
            const passwordField = this.form.elements['password'];
            if (value !== passwordField.value) {
                error = 'Passwords do not match';
            }
        } else if (fieldName === 'phone') {
            if (!this.isValidPhone(value)) {
                error = 'Please enter a valid phone number';
            }
        } else if (fieldName === 'username') {
            if (value.length < 3) {
                error = 'Username must be at least 3 characters';
            }
        }

        this.setFieldError(field, error);
        return !error;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }

    setFieldError(field, error) {
        const errorElement = document.getElementById(`${field.id}Error`);

        if (error) {
            field.classList.add('error');
            errorElement.textContent = error;
            errorElement.setAttribute('role', 'alert');
        } else {
            field.classList.remove('error');
            errorElement.textContent = '';
        }
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = document.getElementById(`${field.id}Error`);
        errorElement.textContent = '';
    }

    saveFormData() {
        this.formInputs.forEach(input => {
            this.formData[input.name] = input.value;
        });
        localStorage.setItem('onboardingFormData', JSON.stringify(this.formData));
    }

    loadFormData() {
        const savedData = localStorage.getItem('onboardingFormData');
        if (savedData) {
            this.formData = JSON.parse(savedData);
            this.formInputs.forEach(input => {
                if (this.formData[input.name]) {
                    input.value = this.formData[input.name];
                }
            });
        }
    }

    populateSummary() {
        document.getElementById('summaryFullName').textContent = this.formData.fullName;
        document.getElementById('summaryEmail').textContent = this.formData.email;
        document.getElementById('summaryPhone').textContent = this.formData.phone;
        document.getElementById('summaryUsername').textContent = this.formData.username;
    }

    completeOnboarding() {
        this.saveFormData();
        localStorage.removeItem('onboardingFormData');
        this.showSuccessModal();
    }

    showSuccessModal() {
        this.successModal.classList.add('active');
        this.successModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.successModal.classList.remove('active');
        this.successModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
        this.resetForm();
    }

    resetForm() {
        this.form.reset();
        this.formInputs.forEach(input => {
            input.classList.remove('error');
            const errorElement = document.getElementById(`${input.id}Error`);
            if (errorElement) {
                errorElement.textContent = '';
            }
        });
        this.formData = {
            fullName: '',
            email: '',
            phone: '',
            username: '',
            password: '',
            confirmPassword: ''
        };
        this.goToStep(1);
    }

    scrollToForm() {
        const formWrapper = document.querySelector('.form-wrapper');
        if (formWrapper) {
            formWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OnboardingForm();
});