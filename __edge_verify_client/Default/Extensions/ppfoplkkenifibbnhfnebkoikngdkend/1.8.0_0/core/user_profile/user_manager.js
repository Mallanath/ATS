import { Serializer } from "../utils/serializer.js";
import { User } from "./user.js";
var UserManager = /** @class */ (function () {
    function UserManager() {
        this.currentUser = null;
        this.users = [];
    }
    UserManager.from = function (another) {
        var newManager;
        if (typeof another === 'string') {
            newManager = Serializer.deserialize(another, new UserManager());
        }
        else {
            newManager = Serializer.clone(another, new UserManager());
        }
        var users = [];
        newManager.users.forEach(function (e) {
            users.push(User.from(e));
        });
        newManager.users = users;
        return newManager;
    };
    return UserManager;
}());
export { UserManager };
