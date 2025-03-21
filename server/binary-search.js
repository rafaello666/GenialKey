"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BinarySearch = {
    /**
     * Searches for an item in an array which matches a certain condition.
     * This requires the condition to only match one item in the array,
     * and for the array to be ordered.
     *
     * @param list The array to search.
     * @param comparisonFn
     *      Called and provided a candidate item as the first argument.
     *      Should return:
     *          > -1 if the item should be located at a lower index than the provided item.
     *          > 1 if the item should be located at a higher index than the provided item.
     *          > 0 if the item is the item you're looking for.
     *
     * @returns the object if found, otherwise returns null
     */
    search: function (list, comparisonFn) {
        var minIndex = 0;
        var maxIndex = list.length - 1;
        var currentIndex = null;
        var currentElement = null;
        while (minIndex <= maxIndex) {
            currentIndex = ((minIndex + maxIndex) / 2) | 0;
            currentElement = list[currentIndex];
            var comparisonResult = comparisonFn(currentElement);
            if (comparisonResult > 0) {
                minIndex = currentIndex + 1;
            }
            else if (comparisonResult < 0) {
                maxIndex = currentIndex - 1;
            }
            else {
                return currentElement;
            }
        }
        return null;
    },
};
exports.default = BinarySearch;
