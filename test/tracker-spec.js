var expect = chai.expect;

describe('AutoChart Tracking API', function() {
    var TEST_DATA = {
        vehicle: {
            'registrationYear': 2002,
            'trim': '4dr Sdn XE Manual',
            'listingId': 'P6631452',
            'photoUrl': 'http://images.exampledealersite.com/5/0/7/9184956705.jpg',
            'color': 'Green',
            'make': 'Nissan',
            'title': ' Used 2002 Nissan Sentra 4dr Sdn XE Manual ',
            'vin': '9N1CB51D12L631452',
            'odometer': 186138,
            'transmission': '',
            'bodyStyle': '4D Sedan',
            'url': 'http://www.exampledealersite.com/VehicleDetails/used-2002-Nissan-Sentra-4dr_Sdn_XE_Manual-Chesapeake-VA/2324337633',
            'model': 'Sentra',
            'price': 2500,
            'condition': 'Used'
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
    var DISABLED_API_KEY = '5777e9f16d38af15178611f1';

    describe('constructor', function() {
        var _tracker;
        beforeEach(function() {
            _tracker = new AutoChartTracker();
        });
        describe('validates accountKey', function() {
            it('should error if accountKey is absent', function() {
                expect(function() {
                    _tracker.init();
                }).to.throw(Error);
            });
            it('should error if accountKey is invalid type', function() {
                expect(function() {
                    _tracker.init(new Date());
                }).to.throw(Error);
            });
            it('should error if accountKey string isn\'t correct length', function() {
                expect(function() {
                    _tracker.init('iamnotexactly24chars');
                }).to.throw(Error);
            });
        });
    });

    describe('Tracking API methods', function() {
        var _tracker;

        beforeEach(function() {
            _tracker = new AutoChartTracker();
            _tracker.init(API_KEY);
        });

        describe('#page', function() {
            it('should send PageView VisitorAction', function(done) {
                _tracker.page(successCallback(done));
            });
        });

        describe('disabled accountKey', function() {
            var disabledTracker;
            beforeEach(function () {
                disabledTracker = new AutoChartTracker();
                disabledTracker.init(DISABLED_API_KEY);
            });
            it('should not send PageView VisitorAction', function(done) {
                var response = disabledTracker.page();
                expect(response).to.equal(false);
                done();
            });
        });

        describe('AUTOCHART_DISABLED flag', function() {
            var disabledTracker;
            beforeEach(function () {
                window.AUTOCHART_DISABLED = true;
                disabledTracker = new AutoChartTracker();
                disabledTracker.init(API_KEY);
            });
            it('should not send PageView VisitorAction', function(done) {
                var response = disabledTracker.page();
                expect(response).to.equal(false);
                done();
            });
            afterEach(function () {
                window.AUTOCHART_DISABLED = undefined;
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
                'recipient': 'test recipient',
                'subject': 'Mocha test'
            };
            describe('#trackLead', function() {
                it('should send Lead', function(done) {
                    _tracker.trackLead(lead, null, successCallback(done));
                });

                it('should throw error if no lead is provided', function() {
                    expect(function() {
                        _tracker.trackLead(null, null);
                    }).to.throw(Error);
                });
            });
            describe('#trackLeadForm', function() {
                var form, submit;
                var formId = 'vdpLeadForm';
                beforeEach(function() {
                    form = document.createElement('form');
                    form.id = formId;
                    //form.action = '/test/server/mock.html';
                    form.target = '_blank';
                    submit = document.createElement('input');
                    submit.type = 'submit';
                    form.appendChild(submit);
                    document.body.appendChild(form);
                });
                xit('should send Lead when form submitted', function(done) {
                    //Add form to document
                    _tracker.trackLeadForm(form, function() {
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
                _tracker.trackSearch(criteria, null, successCallback(done));
            });
        });

        describe('#trackVisitIntent', function() {
            it('should send event when map viewed', function(done) {
                _tracker.trackVisitIntent('map', null, successCallback(done));
            });
            it('should send event when opening hours viewed', function(done) {
                _tracker.trackVisitIntent('hours', null, successCallback(done));
            });
            it('should send event when directions viewed', function(done) {
                _tracker.trackVisitIntent('directions', null, successCallback(done));
            });
        });

        describe('#tag', function() {
            it('should send tags when single string is supplied', function(done) {
                _tracker.tag('Summer Special', successCallback(done));
            });
            it('should send tags when array of strings is supplied', function(done) {
                _tracker.tag(['Summer Special', 'Finance'], successCallback(done));
            });
            it('should strip out non-alphanumeric chars from tags', function(done) {
                _tracker.tag(['Joe\'s Autos Offer', 'Questionable Offer?', 'Comma, separated, offer'], successCallback(done));
            });
            it('should error if tags is blank', function() {
                expect(function() {
                    _tracker.tag('', successCallback());
                }).to.
                throw(Error);
            });
            it('should error if tags is absent', function() {
                expect(function() {
                    _tracker.tag(null, successCallback());
                }).to.
                throw(Error);
            });
        });

        describe('#trackFinance', function() {
            var financeData = TEST_DATA.finance;
            it('should send finance event', function(done) {
                _tracker.trackFinance(financeData, null, null, successCallback(done));
            });
            it('should allow vehicle data to be included ', function(done) {
                _tracker.trackFinance(financeData, TEST_DATA.vehicle, null, successCallback(done));
            });
            it('should error if financeData is absent', function() {
                expect(function() {
                    _tracker.trackFinance(null);
                }).to.
                throw(Error);
            });
        });

        describe('#ready', function() {
            it('should invoke callback straight away', function() {
                var spy = sinon.spy();
                autochart.ready(spy);
                expect(spy).to.have.been.calledOnce;
            });
        });
    });

    describe('autochart.util', function() {
        it('should expose all Utils functions', function() {
            expect(autochart.util).to.exist;
            autochart.util.log('test log');
            autochart.util.error('test error');
        });

        it('#getQueryParameters should print out querystring as object', function() {
            var qs = autochart.util.getQueryParameters();
            expect(qs).to.exist;
            window.console.dir(qs);
        });
    });

    function successCallback(done) {
        return function(err, response) {
            expect(err).not.to.exist;
            expect(response.created).to.equal(true);
            done();
        };
    }
});