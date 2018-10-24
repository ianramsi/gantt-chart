import { Element, api, track, wire } from 'engine';
import { showToast } from 'lightning-notifications-library';
import { refreshApex } from '@salesforce/apex';

import getAllocationLists from '@salesforce/apex/ganttChart.getAllocationLists';
import saveAllocation from '@salesforce/apex/ganttChart.saveAllocation';

export default class GanttChartResource extends Element {
    @api recordId;
    @api name;
    @api projectId;
    @api startDate;
    @api endDate;

    @track allocationLists = [];

    get isResource() {
        return null == this.projectId;
    }

    get dates() {
        var _dates = [];

        for (var time = this.startDate; time <= this.endDate; time += 24*60*60*1000) {
            _dates.push(new Date(time));
        }

        return _dates;
    }

    get startDateString() {
        return this.startDate + '';
    }

    get endDateString() {
        return this.endDate + '';
    }

    connectedCallback() {
        this.startDateString = this.startDate + '';
        this.endDateString = this.endDate + '';
    }

    wiredAllocationLists;
    @wire(getAllocationLists, { recordId: '$recordId', startDate: '$startDateString', endDate: '$endDateString' })
    wiredGetAllocationLists(value) {
        this.wiredAllocationLists = value;
        if (value.error) {
            this.error = value.error;
        } else if (value.data) {
            this.allocationLists = value.data;
        }
    }

    get link() {
        return '/' + this.recordId;
    }

    handleAllocationEvent(event) {
        var allocation = event.detail;

        if (null == allocation.projectId && null != this.projectId) {
            allocation.projectId = this.projectId;
        }

        if (null == allocation.resourceId) {
            allocation.resourceId = this.recordId;
        }

        saveAllocation(allocation)
        .then(() => {
            refreshApex(this.wiredAllocationLists);
        }).catch(error => {
            showToast({
                message: error.message,
                variant: 'error'
            });
        });
    }
}
