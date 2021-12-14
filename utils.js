export const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export function log(text) {
  console.log(`${new Date().toISOString()}\t${text}`);
}