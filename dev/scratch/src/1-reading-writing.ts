import { freadSync } from './fread-fwrite/fread';
import { fwriteSync } from './fread-fwrite/fwrite';

const iris = freadSync('./data/iris.csv', {
    colClasses: {
        'Sepal.Length': Number,
        'Sepal.Width': Number,
        'Petal.Length': Number,
        'Petal.Width': Number,
        Species: String
    }
});

// console.log(iris);

const smallIris = iris.query((row) => row.Species === 'setosa', {
    select: ['Species', 'Sepal.Width', 'Petal.Length'] as const
});
// console.log(smallIris.toString());

fwriteSync(smallIris, './output/output.csv', {
    separator: ',',
    quote: '"',
    header: true,
    na: 'NA',
    append: true
});
