/* template:
{
    name: "string",
    x_dimension: int,
    y_dimension: int,
    row_body: [array],
    column_body: [array]
}
,
*/
const ARRAY_EXAMPLES = [
    {
        name: "Default 2x2",
        x_dimension: 2,
        y_dimension: 2,
        row_body: [-1,3,2,0],
        column_body: [3,2,4,0]
    }
    ,
    {
        name: "Dominance (2x2)",
        x_dimension: 2,
        y_dimension: 2,
        row_body: [-1,0,2,3],
        column_body: [2,4,-1,2]
    }
    ,
    {
        name: "2x2 ISD (1)",
        x_dimension: 2,
        y_dimension: 2,
        row_body: [1,2,0,1],
        column_body: [1,0,-1,1]
    }
    ,
    {
        name: "2x2 ISD (2)",
        x_dimension: 2,
        y_dimension: 2,
        row_body: [1,0,0,1],
        column_body: [2,3,0,1]
    }
    ,
    {
        name: "Prisoners Dilemna",
        x_dimension: 2,
        y_dimension: 2,
        row_body: [1,-1,2,0],
        column_body: [1,2,-1,0]
    }
    ,
    {
        name: "2x3 ISD Solvable",
        x_dimension: 3,
        y_dimension: 2,
        row_body: [5,3,4,2,5,1],
        column_body: [7,2,0,1,3,6]
    }
    ,
    {
        name: "3x3 ISD Solvable",
        x_dimension: 3,
        y_dimension: 3,
        row_body: [2,0,5,5,1,4,4,-1,7],
        column_body: [2,-7,3,1,2,1,4,3,-1]
    }
    ,
    {
        name: "4x3 ISD Solvable",
        x_dimension: 3,
        y_dimension: 4,
        row_body: [3,4,-5,0,3,-2,9,3,0,0,4,5],
        column_body: [3,2,5,5,8,8,-1,2,-3,1,1,2]
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
        name: "5x5 ISD Solvable",
        x_dimension: 5,
        y_dimension: 5,
        row_body: [
            4,6,7,2,1,
            3,5,8,2,1,
            2,3,6,9,1,
            1,2,-1,7,9,
            0,1,-2,3,8
        ],
        column_body: [
            4,3,2,1,0,
            6,5,3,2,1,
            7,8,6,-1,-2,
            2,2,9,7,3,
            1,1,1,9,8
        ]
    }
    ,
    {
        name: "Cournot (q=0,2,3,4)",
        x_dimension: 4,
        y_dimension: 4,
        row_body: [
            0,0,0,0,
            8,4,2,0,
            9,3,0,-3,
            8,0,-4,-8
        ],
        column_body: [
            0,8,9,8,
            0,4,3,0,
            0,2,0,-4,
            0,0,-3,-8
        ]
    }
    ,
    {
        name: "Exam14Q1 (5x5)",
        x_dimension: 5,
        y_dimension: 5,
        row_body: [
            1,5,0,0,-6,
            -5,0,5,0,0,
            0,-5,0,5,5,
            0,0,-5,0,0,
            0,0,-5,0,-6

        ],
        column_body: [
            1,-5,0,0,0,
            5,0,-5,0,0,
            0,5,0,-5,-5,
            0,0,5,0,0,
            -6,0,5,0,-6
        ]
    }
    ,
    {
        name: "Exam14Q3 (3x3)",
        x_dimension: 3,
        y_dimension: 3,
        row_body: [4,0,3,1,1,1,2,-1,2],
        column_body: [4,1,2,0,1,-1,3,1,2]
    }
    ,
    {
        name: "A 3x3 Problem (1)",
        x_dimension: 3,
        y_dimension: 3,
        row_body: [-1,0,1,-2,1,0,1,5,-1],
        column_body: [1,0,-1,2,1,5,-1,-2,1]
    }
    ,
    {
        name: "A 3x3 Problem (2)",
        x_dimension: 3,
        y_dimension: 3,
        row_body: [0,5,3,3,4,0,2,7,4],
        column_body: [4,5,3,2,2,1,3,-7,1]
    }
    ,
    {
        name: "Compare c and C",
        x_dimension: 3,
        y_dimension: 3,
        row_body: [1,-5,1,-5,1,1,0,0,0],
        column_body: [3,0,1,3,2,1,0,3,1]
    }
    ,
    {
        name: "Weak Dominance",
        x_dimension: 2,
        y_dimension: 2,
        row_body: [1,0,0,0],
        column_body: [2,3,0,1]
    }
]
