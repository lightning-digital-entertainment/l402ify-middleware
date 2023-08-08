type ParsedPayData = {
    callback: string;
    min: number;
    max: number;
};

type PayData = {
    callback: string;
    minSendable: string;
    maxSendable: string;
    metadata: string;
};

const LN_ADDRESS_REGEX =
    /^((?:[^<>()\[\]\\.,;:\s@"]+(?:\.[^<>()\[\]\\.,;:\s@"]+)*)|(?:".+"))@((?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(?:(?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

async function getLnurlpData(lnAddress: string): Promise<ParsedPayData> {
    if (!lnAddress.match(LN_ADDRESS_REGEX)) {
        throw new Error("Invalid Lightning Address");
    }
    const [username, url] = lnAddress.split("@");
    try {
        const req = await fetch(
            `https://${url}/.well-known/lnurlp/${username}`
        );
        const data = (await req.json()) as PayData;
        return parseLnurlp(data);
    } catch (e) {
        throw new Error("Could not get LNURL pay data");
    }
}

function parseLnurlp(data: PayData): ParsedPayData {
    const callback = (data.callback + "").trim();
    const min = Math.ceil(Number(data.minSendable || 1));
    const max = Number(data.maxSendable);

    return {
        callback,
        min,
        max,
    };
}

async function getLnurlpInvoice(
    lnurlpData: ParsedPayData,
    amountInSats: number
) {
    const amountInMilliSats = amountInSats * 1000;
    if (amountInMilliSats > lnurlpData.max || amountInMilliSats < lnurlpData.min) {
        throw new Error("Amount is out of bounds");
    }
    const req = await fetch(
        `${lnurlpData.callback}?amount=${amountInMilliSats}`
    );
    const data = await req.json();
    return data.pr;
}

export async function getInvoiceFromAddress(
    lnAddress: string,
    amountInSats: number
) {
    const data = await getLnurlpData(lnAddress);
    const invoice = await getLnurlpInvoice(data, amountInSats);
    return invoice;
}
