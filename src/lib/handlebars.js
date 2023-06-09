const { format } = require('timeago.js');

const helpers = {};

helpers.timeago = (timestamp) => {
    return format(timestamp);
}

helpers.switch = (value, options) => {
    this.switch_value = value;
    this.switch_break = false;
    return options.this;
};

helpers.case = (value, options) => {
    if (value == this.switch_value) {
        this.switch_break = true;
        return options.this;
    }
};

helpers.default = (value, options) => {
    if (this.switch_break == false) {
        return options.this;
    }
};

helpers.ifEquals = (arg1, arg2, options) => {
    return (arg1 === arg2) ? options.this : options.inverse(this);
};

// helpers.ifCond = (v1, operator ,v2, options) => {
//     switch(operator){
//         case '==':
//             return (v1 == v2) ? options.this : options.inverse(this);
//         case '===':
//             return (v1 === v2) ? options.this : options.inverse(this);
//         case '!=':
//             return (v1 != v2) ? options.this : options.inverse(this);
//         case '!==':
//             return (v1 !== v2) ? options.this : options.inverse(this);
//         case '<':
//             return (v1 < v2) ? options.this : options.inverse(this);
//         case '<=':
//             return (v1 <= v2) ? options.this : options.inverse(this);
//         case '>':
//             return (v1 > v2) ? options.this : options.inverse(this);
//         case '>=':
//             return (v1 >= v2) ? options.this : options.inverse(this);
//         case '&&':
//             return (v1 && v2) ? options.this : options.inverse(this);
//         case '||':
//             return (v1 || v2) ? options.this : options.inverse(this);
//         default:
//             return options.inverse(this);
//     }
// }

module.exports = helpers;