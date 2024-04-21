
const mongoose = require("mongoose");

const KYCSetting = mongoose.model(
    "KYCSetting",
    new mongoose.Schema({
        kyc_type: String,   // "REAL" or "DEMO"
        FIRST_NAME:{
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        }, 
        LAST_NAME: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        BIRTH_DATE: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        PHONE: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        COUNTRY: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        STATE: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        CITY: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        ZIP_CODE: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        STREET: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        FAX_NUMBER: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        PASSPORT_ID_NUMBER: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        PASSPORT_ID_COUNTRY: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: false, required: false}
        },
        TAX_IDENTIFICATION_NUMBER: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: false, required: false}
        },
        CITIZENSHIP: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: false, required: false}
        },
        MARITAL_STATUS: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: false, required: false}
        },
        DEMO_FIRST_NAME:{
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        }, 
        DEMO_LAST_NAME: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        DEMO_BIRTH_DATE: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        DEMO_PHONE: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        DEMO_COUNTRY: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        DEMO_STATE: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        DEMO_CITY: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        DEMO_ZIP_CODE: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: true, required: true}
        },
        DEMO_STREET: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: false, required: true}
        },
        DEMO_FAX_NUMBER: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: false, required: true}
        },
        DEMO_PASSPORT_ID_NUMBER: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: false, required: true}
        },
        DEMO_PASSPORT_ID_COUNTRY: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: false, required: false}
        },
        DEMO_TAX_IDENTIFICATION_NUMBER: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: false, required: false}
        },
        DEMO_CITIZENSHIP: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: false, required: false}
        },
        DEMO_MARITAL_STATUS: {
            type: {
                active: Boolean, 
                required: Boolean
            },  
            default :{ active: false, required: false}
        },
        isVerification: {
            type: Boolean,
            default: false
        }, 
        isEmailVerification: {
            type: Boolean,
            default: false
        }, 
        googleVisisioinCheck: {
            type: Boolean,
            default: false
        }, 
        branch: String, 
        createdAt: { type: Date, default: Date.now },
    })
);
module.exports = KYCSetting;