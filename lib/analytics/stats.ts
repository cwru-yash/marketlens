export function median(values: number[]): number {
    if (values.length === 0) {
        throw new Error("median requires at least one value");
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const middleIndex = Math.floor(sortedValues.length / 2);

    if (sortedValues.length % 2 === 1) {
        return sortedValues[middleIndex];
    }

    const leftMiddle = sortedValues[middleIndex - 1];
    const rightMiddle = sortedValues[middleIndex];

    return (leftMiddle + rightMiddle) / 2;
}