import { getGooglePlaces } from "./index";

// Using this place https://www.google.com/maps/dir//48.8499546,2.2884633/@48.8516282,2.2879163,15.65z/data=!4m2!4m1!3e0?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoKLDEwMDc5MjA2OUgBUAM%3D

const main = async () => {
    const places = await getGooglePlaces({ latitude: 48.84995, longitude: 2.288463 })
        .radius(1000)
        .apiKey("")
        .onFinished("json")
        .showLogs()
        .showProgress()
        .run();
    console.log(places);
};

await main();