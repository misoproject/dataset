// subset
ds({ row : [0, 10], column: [1,2] });

//filter
ds( { row : [0, 10], column: [1,2], filter : function(row) {
    if (row[1] > 10) {
      return row;    
    }
} } );
//transform

subset = ds.filter(function(row, column) {
    if ((row > 5) && (column === 2)) {
       return true;
    }    
})

subset.transform(function(row, rowNumber) {
    row.set(3, row.get(3) * 10)
    return row;
});

row.set(index, value) {
    _stack.push( { row : this._rowNumber , column : index , oldValue : this.get(3), newValue :  value });
    ...
}

original:
[[0,45,2],[1,46,2],[1,41,3]]

subset:
[1,41,3]

original.filter(function(row, column, value) {
    if (value < 5) {
        return true;
    } else {
        return false;
    }
})l;

[true, false, false], [false, false, true], [true, true, true]];
new DataSet([0, null, null], [null, null, 2], [1, 41, 3]]);                                                                

original.filter(function(row) {
    isRowTruthy = _.map(function(value, row) {
        if (Math.random()*value < 5) {
            return true;
        } else {
            return false;
        }
    }).compact();
    
    
});


subset.bind('change', function(event) {
    event.delta? [[null, null, null, true], [null, null, null, true]];
});

[[10,3,4,5],
[10,3,4,5]]

[100, 3, 4, 5]

event.delta = 



ds.column(5)
ds.filter(function(row, column) {
    if (column === 5) {
        return true;
    }
});

'original
[[1,2,3,a,b],[4,5,6,c,d],[7,8,9,e,f]]

filter 1
[[1,3,b],[4,6,d],[7,9,f]]
[[true, null, true, null, true],[true, null, true, null, true],[true, null, true, null, true]]

filter 2:
[[4,6,d]]
[[null, null, null],[true, true, true],[null, null, null]]

ds.filter(function(row, rowNumber) {
    if (row[0] > row[1]) {
        return [row[1], row[3], row[5]];
    } else { 
        return [row[2], row[3], row[5]];
    }
}).filter(function(row, rowNumber) {
   if (rowNumber %2 === 0) {
      return row; 
    }  
});


_this.rows.each(row, rowIndex,  function){
    newRow = function(row, rowIndex);
    if (newRow !== null) {
          
    }
})