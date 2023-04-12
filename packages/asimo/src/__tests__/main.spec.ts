import { describe, expect, it } from 'vitest'
import { hello} from '../asimo';

describe('Asimo', () => {
    it('should expose hello', async function () {
        expect(hello()).toBe("hello world");
    });
});
