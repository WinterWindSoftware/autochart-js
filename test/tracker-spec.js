var expect = chai.expect;
//var assert = chai.assert;
//
describe('AutoChart Tracking API', function() {
    var TEST_DATA = {
        vehicle : {
            'registrationYear' : 2002,
            'trim' : '4dr Sdn XE Manual',
            'listingId' : 'P6631452',
            'photoUrl' : 'http://images.exampledealersite.com/5/0/7/9184956705.jpg',
            'color' : 'Green',
            'make' : 'Nissan',
            'title' : ' Used 2002 Nissan Sentra 4dr Sdn XE Manual ',
            'vin' : '9N1CB51D12L631452',
            'odometer' : 186138,
            'transmission' : '',
            'bodyStyle' : '4D Sedan',
            'url' : 'http://www.exampledealersite.com/VehicleDetails/used-2002-Nissan-Sentra-4dr_Sdn_XE_Manual-Chesapeake-VA/2324337633',
            'model' : 'Sentra',
            'price' : 2500,
            'condition' : 'Used'
        },
        finance: {
            monthlyPaymentMin: 100,
            monthlyPaymentMax: 150,
            mileagePerAnnum: 5000,
            downPayment: 999,
            termMonths: 48,
            interestRate: 6.5
        }
    };

    this.timeout(5000);
    var API_KEY = '533555fcabb2377f5aea338e';

    describe('constructor', function () {
        beforeEach(function() {
            var self = this;
            self.tracker = new AutoChartTracker();
        });
        describe('validates accountKey', function() {
            it('should error if accountKey is absent', function() {
                expect(function() {
                    this.tracker.init();
                }).to.throw(Error);
            });
            it('should error if accountKey is invalid type', function() {
                expect(function() {
                    this.tracker.init(new Date()); 
                }).to.throw(Error);
            });
            it('should error if accountKey string isn\'t correct length', function() {
                expect(function() {
                    this.tracker.init('iamnotexactly24chars'); 
                }).to.throw(Error);
            });
        });
    });

    describe('Tracking API methods', function() {
        beforeEach(function() {
            var self = this;
            self.tracker = new AutoChartTracker();
            self.tracker.init(API_KEY);
        });

        describe('#page', function() {
            it('should send PageView VisitorAction', function(done) {
                this.tracker.page(successCallback(done));
            });
        });

        describe('Lead Tracking', function() {
            var lead = {
                    'contact': {
                        'name': 'Mocha Tester',
                        'company': 'WWS',
                        'longitude': 1,
                        'phone': '(886) 592-3037',
                        'latitude': -1,
                        'email': 'tester@autochart.io'
                    },
                    'vehicle': {
                        'province': 'Ulster',
                        'city': 'Belfast',
                        'trim': '',
                        'price': 1750,
                        'odometer': 204275.7,
                        'condition': 'used',
                        'year': 2004,
                        'model': 'Sonata',
                        'make': 'Hyundai'
                    },
                    'message': 'Mocha test',
                    'channel': 'form',
                    'subject': 'Mocha test'
                };
            describe('#trackLead', function() {
                it('should send Lead', function(done) {
                    
                    this.tracker.trackLead(lead, null, successCallback(done));
                });

                 it('should throw error if no lead is provided', function() {
                     expect(function() {
                        this.tracker.trackLead(null, null);
                    }).to.throw(Error);
                });
            });
            describe('#trackLeadForm', function() {
                var form, submit;
                var formId = 'vdpLeadForm';
                beforeEach(function () {
                  form = document.createElement('form');
                  form.id = formId;
                  form.action = '/test/server/mock.html';
                  form.target = '_blank';
                  submit = document.createElement('input');
                  submit.type = 'submit';
                  form.appendChild(submit);
                  document.body.appendChild(form);
                });
                it('should send Lead when form submitted', function(done) {
                    //Add form to document
                    this.tracker.trackLeadForm(form, function() {
                        lead.contact.name = 'Form Guy';
                        return lead;
                    }, null, successCallback(done));
                    submit.click();
                });
            });

        });

        describe('#trackSearch', function() {
            it('should send Search', function(done) {
                var criteria = {
                    searchType: 'advanced',
                    make: 'Honda',
                    model: 'Civic'
                };
                this.tracker.trackSearch(criteria, null, successCallback(done));
            });    
        });

        describe('#trackVisitIntent', function() {
            it('should send event when map viewed', function(done) {
                this.tracker.trackVisitIntent('map', null, successCallback(done));
            });
            it('should send event when opening hours viewed', function(done) {
                this.tracker.trackVisitIntent('hours', null, successCallback(done));
            });
            it('should send event when directions viewed', function(done) {
                this.tracker.trackVisitIntent('directions', null, successCallback(done));
            });
        });

        describe('#tag', function() {
            it('should send tags when single string is supplied', function(done) {
                this.tracker.tag('Summer Special', successCallback(done));
            });
            it('should send tags when array of strings is supplied', function(done) {
                this.tracker.tag(['Summer Special', 'Finance'], successCallback(done));
            });
            it('should strip out non-alphanumeric chars from tags', function(done) {
                this.tracker.tag(['Joe\'s Autos Offer', 'Questionable Offer?', 'Comma, separated, offer'], successCallback(done));
            });
            it('should error if tags is blank', function() {
                expect(function() {
                    this.tracker.tag('', successCallback());
                }).to.throw(Error);
            });
            it('should error if tags is absent', function() {
                expect(function() {
                    this.tracker.tag(null, successCallback());
                }).to.throw(Error);
            });
        });

        describe.only('#trackFinance', function() {
            var financeData = TEST_DATA.finance;
            it('should send finance event', function(done) {
                this.tracker.trackFinance(financeData, null, null, successCallback(done));
            });
            it('should allow vehicle data to be included ', function(done) {
                this.tracker.trackFinance(financeData, TEST_DATA.vehicle, null, successCallback(done));
            });
        });
    });    

    function successCallback(done) {
        return function(response) {
                expect(response.created).to.equal(true);
                done();
            };
    }
});
