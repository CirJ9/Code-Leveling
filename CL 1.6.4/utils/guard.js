/**
 * 
 * @param {never} _value 
 */
export function exhaustiveGuard(_value) {
    throw new Error(`Error! Reached forbidden guard funtion with unexpected value: ${JSON.stringify(_value)}`);
}