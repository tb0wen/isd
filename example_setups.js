/* template:
{
    name: "string",
    x_dimension: int,
    y_dimension: int,
    row_body: [array],
    column_body: [array]
}

*/
const ARRAY_EXAMPLES = [
    {
        name: "simple 2x2 ISD solvable",
        x_dimension: 2,
        y_dimension: 2,
        row_body: [1,2,2,3],
        column_body: [2,3,4,2]
    }
    ,
    {
        name: "simple 4x4 ISD solvable",
        x_dimension: 4,
        y_dimension: 4,
        row_body: [
            3,5,7,8,
            2,6,8,7,
            2,5,8,8,
            2,5,7,9],
        column_body: [
            3,2,2,2,
            5,3,4,4,
            7,12,8,9,
            5,4,4,3]
    }
    ,
    {
        name: "4x3 ISD solvable",
        x_dimension: 3,
        y_dimension: 4,
        row_body: [
            9,10,1,
            6,9,4,
            15,9,6,
            1,10,13],
        column_body: [
            9,8,11,
            11,14,14,
            5,8,3,
            7,7,8]
    }
]
