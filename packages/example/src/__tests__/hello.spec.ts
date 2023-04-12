import { describe, expect, it } from 'vitest'
import { myhello} from '../hello';

describe('Asimo example', () => {
    it('should expose myhello', async function () {
        expect(myhello()).toBe("my hello world");
    });
});
