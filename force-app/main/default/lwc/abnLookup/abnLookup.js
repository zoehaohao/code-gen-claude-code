import { LightningElement, track, wire } from 'lwc';
import searchByAbn from '@salesforce/apex/AbnLookupController.searchByAbn';
import searchByName from '@salesforce/apex/AbnLookupController.searchByName';

export default class AbnLookup extends LightningElement {
    @track searchType = 'abn';
    @track searchTerm = '';
    @track results = [];
    @track isLoading = false;
    @track error = '';

    get isAbnSearch() {
        return this.searchType === 'abn';
    }

    get isNameSearch() {
        return this.searchType === 'name';
    }

    get searchLabel() {
        return this.isAbnSearch ? 'ABN' : 'Business Name';
    }

    get searchPlaceholder() {
        return this.isAbnSearch ? 'Enter 11-digit ABN' : 'Enter business name (min. 3 characters)';
    }

    get hasResults() {
        return this.results.length > 0;
    }

    handleSearchTypeChange(event) {
        this.searchType = event.target.value;
        this.clearResults();
    }

    handleSearchTermChange(event) {
        this.searchTerm = event.target.value;
        this.error = '';
    }

    async handleSearch() {
        if (!this.validateInput()) {
            return;
        }

        this.isLoading = true;
        this.error = '';
        this.results = [];

        try {
            if (this.isAbnSearch) {
                const result = await searchByAbn({ abn: this.searchTerm });
                if (result) {
                    this.results = [this.processAbnResult(result)];
                }
            } else {
                const results = await searchByName({ businessName: this.searchTerm });
                this.results = results.map(result => this.processAbnResult(result));
            }
        } catch (error) {
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }

    validateInput() {
        if (this.isAbnSearch) {
            const abnRegex = /^\d{11}$/;
            if (!abnRegex.test(this.searchTerm.replace(/\s/g, ''))) {
                this.error = 'Please enter a valid 11-digit ABN';
                return false;
            }
        } else {
            if (this.searchTerm.trim().length < 3) {
                this.error = 'Please enter at least 3 characters for business name search';
                return false;
            }
        }
        return true;
    }

    clearResults() {
        this.searchTerm = '';
        this.results = [];
        this.error = '';
    }

    processAbnResult(result) {
        return {
            ...result,
            formattedAbn: this.formatAbn(result.abn)
        };
    }

    formatAbn(abn) {
        const cleanAbn = abn.replace(/\s/g, '');
        return cleanAbn.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }

    handleError(error) {
        console.error('ABN Lookup Error:', error);
        this.error = error.body?.message || 'An error occurred while searching. Please try again.';
    }
}