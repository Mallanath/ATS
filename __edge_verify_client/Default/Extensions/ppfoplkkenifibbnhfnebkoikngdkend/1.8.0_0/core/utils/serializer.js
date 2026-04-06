var Serializer = /** @class */ (function () {
    function Serializer() {
    }
    Serializer.replacer = function (key, value) {
        if (value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()), // or with spread: value: [...value]
            };
        }
        else if (value instanceof Set) {
            return {
                dataType: 'Set',
                value: Array.from(value.values()),
            };
        }
        else if (value instanceof Date) {
            return {
                dataType: 'Date',
                value: value.toISOString(),
            };
        }
        else {
            return value;
        }
    };
    Serializer.reviver = function (key, value) {
        if (typeof value === 'object' && value !== null) {
            if (value.dataType === 'Map') {
                return new Map(value.value);
            }
            else if (value.dataType === 'Set') {
                return new Set(value.value);
            }
            else if (value.dataType === 'Date') {
                return new Date(value.value);
            }
        }
        return value;
    };
    Serializer.serialize = function (object) {
        return JSON.stringify(object, Serializer.replacer);
    };
    Serializer.clone = function (object, target) {
        return Serializer.deserialize(Serializer.serialize(object), target);
    };
    Serializer.deserialize = function (serializedObjectData, target) {
        var serializedObject;
        if (typeof serializedObjectData === 'string') {
            serializedObject = JSON.parse(serializedObjectData, Serializer.reviver);
        }
        else {
            serializedObject = serializedObjectData;
        }
        if (target) {
            Object.entries(target).forEach(function (_a) {
                var _b;
                var key = _a[0], value = _a[1];
                var serializedValue = serializedObject[key];
                Object.assign(target, (_b = {}, _b[key] = serializedValue, _b));
            });
            return target;
        }
        else {
            var newObject_1 = Object.create(null);
            Object.entries(serializedObject).forEach(function (_a) {
                var _b;
                var key = _a[0], value = _a[1];
                var serializedValue = serializedObject[key];
                Object.assign(newObject_1, (_b = {}, _b[key] = serializedValue, _b));
            });
            return newObject_1;
        }
    };
    return Serializer;
}());
export { Serializer };
