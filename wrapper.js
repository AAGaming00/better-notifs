module.exports = `console.log('loading BN')
if (process.argv[1] === 'bn-show') {
    process.on('message', (data) => {
    require(process.argv[2])(data);
    })
return
}
`;
