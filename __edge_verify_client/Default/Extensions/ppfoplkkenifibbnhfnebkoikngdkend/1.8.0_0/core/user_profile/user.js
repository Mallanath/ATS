import { Serializer } from "../utils/serializer.js";
var User = /** @class */ (function () {
    function User() {
    }
    User.from = function (another) {
        var newInstance;
        if (typeof another === 'string') {
            newInstance = Serializer.deserialize(another, new User());
        }
        else {
            newInstance = Serializer.clone(another, new User());
        }
        return newInstance;
    };
    return User;
}());
export { User };
