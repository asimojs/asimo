import { hello } from '@asimojs/asimo';

export function myhello() {
    return "my " + hello();
}

console.log(myhello());
