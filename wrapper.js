module.exports = `console.log('loading BN')
console.log(process.argv);
if (process.argv[1] === 'bn-show') {
    process.on('message', (data) => {
    require(process.argv[2])(data);
    })
return
}
`;
