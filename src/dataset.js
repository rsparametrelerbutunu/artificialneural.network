// Dataset related variables and functions.

let data = {
	dataset: null,
	columns: {},
	structure: {
		n_samples: 0,
		n_features: 0,
		n_targets: 0
	},

	X: null,
	y: null,
	stageSample: {
		input: null,
		target: null
	},

	compiled: false
};

const csvURLs = [
	"datasets/binary_classification_data.csv",
	"datasets/regression_data.csv",
	"https://storage.googleapis.com/tfjs-examples/multivariate-linear-regression/data/boston-housing-train.csv"
];

getStageSampleFromDataset = (idx=null) => {
	// Sample randomly if index is not given
	idx = (idx !== null ? idx : getRandomInt(0, data.structure.n_samples));

	// Get input and target output of sample as tensor, set to stage
	data.stageSample.input = data.X.slice([idx, 0], [1, data.structure.n_features]);
	data.stageSample.target = data.y.slice([idx, 0], [1, data.structure.n_targets]);

	console.log("Sampled:");
	console.log(data.stageSample.input.toString());
	console.log(data.stageSample.target.toString());
};

// Gets called whenever dataset changes
onChangeDataset = () => {
	// Get first sample on stage
	getStageSampleFromDataset(0);

	// Set neural network input/output layers' neuron count
	nnStructure.inputLayer.args.inputShape = [data.structure.n_features];
	nnStructure.outputLayer.args.units = data.structure.n_targets;
	onChangeNeuralNetwork();
};

compileDataset = () => {
	// Set dataset as compiled
	data.compiled = true;
};

// Initializes dataset with given URL
loadDataset = (csvURL) => {
	if(csvURL.length == 0 || !csvURL.endsWith(".csv")) return false;

	// Build CSVDataset & get full array
	let csvDataset = null;
	try{
		csvDataset = tf.data.csv(csvURL);
	}catch{
		return false;
	}
	if(!csvDataset) return false;

	csvDataset.toArray().then(csvDatasetArray => {
		// Set dataset as not-compiled yet
		data.compiled = false;

		// Set builded dataset as main
		data.dataset = csvDataset;

		// Get data columns
		data.columns = {};
		csvDataset.fullColumnNames.forEach(
			(colName, colIndex) => {
				data.columns[colName] = {
					isTarget: (colIndex == (csvDataset.fullColumnNames.length-1))
				}
			}
		);

		// Set data structure values
		data.structure.n_samples = csvDatasetArray.length;

		// Taking last column as target, others are X's
		data.structure.n_features = (Object.keys(csvDatasetArray[0]).length-1);
		data.structure.n_targets = 1;

		// Get input and target tensors
		data.X = tf.tensor(
			// Get all feature values in a nested-list
			csvDatasetArray.map((row) => {
				return Object.entries(row).map(([k, v]) => {
					return (!data.columns[k].isTarget) ? v : null;
				}).filter(v => v !== null);
			}),
			// Shape
			[
				data.structure.n_samples,
				data.structure.n_features
			]
		);
		data.y = tf.tensor(
			// Get all target values in a nested-list
			csvDatasetArray.map((row) => {
				return Object.entries(row).map(([k, v]) => {
					return (data.columns[k].isTarget) ? v : null;
				}).filter(v => v !== null);
			}),
			// Shape
			[
				data.structure.n_samples,
				data.structure.n_targets
			]
		);

		console.log("Dataset built", data.structure);
		onChangeDataset();
		return true;
	});
	return true;
};

// Draws the dataset on the given canvas
drawDataset = (canvas, vArgs) => {
	// Calculate necessary values for drawing
	let tableW = (canvas.width * vArgs.scaleX);
	let tableH = (canvas.height * vArgs.scaleY);

	// Limit shown sample count
	let show_n_samples = max(min(data.structure.n_samples, 15), 10);
	let eachCellH = (tableH / show_n_samples);
	let eachCellW = (tableW / Object.keys(data.columns).length);

	let startTableX = (canvas.width * (1-vArgs.scaleX) / 2);
	let startTableY = (canvas.height * (1-vArgs.scaleY) / 2);
	let startCellX = startTableX + (eachCellW/2);
	let startCellY = startTableY + (eachCellH/2);

	// Table border
	canvas.rectMode(CORNER);
	canvas.noFill();
	canvas.stroke(255);
	canvas.strokeWeight(2);
	canvas.rect(startTableX, startTableY, tableW, tableH);

	// Draw headers
	let rowIndex = 0;
	Object.entries(data.columns).forEach(([colName, colObj], colIndex) => {
		let centerX = (startCellX + (colIndex * eachCellW));
		let centerY = (startCellY + (rowIndex * eachCellH));

		// Header cell
		canvas.noFill();
		canvas.stroke(255);
		canvas.strokeWeight(1);
		canvas.rectMode(CENTER, CENTER);
		canvas.rect(centerX, centerY, eachCellW, eachCellH);

		// Header text
		canvas.textAlign(CENTER, CENTER);
		canvas.textSize(24);
		canvas.textFont(MAIN_FONT);
		canvas.fill(255);
		canvas.text(colName, centerX, centerY);
	});
};
