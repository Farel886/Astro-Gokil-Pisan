export async function GET() {
  try {
    const latitude = -6.2;
    const longitude = 106.8;

    const start = "20261001";
    const end = "20261007";

    const url =
      `https://power.larc.nasa.gov/api/temporal/daily/point` +
      `?parameters=T2M` +
      `&community=RE` +
      `&longitude=${longitude}` +
      `&latitude=${latitude}` +
      `&start=${start}` +
      `&end=${end}` +
      `&format=JSON`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `NASA POWER request failed: ${response.status}`
      );
    }

    const data = await response.json();

    const temperatureData = data?.properties?.parameter?.T2M;

    if (!temperatureData) {
      throw new Error("NASA POWER temperature data not found");
    }

    const readings = Object.entries(temperatureData)
      .filter(([date, temperature]) => {
        return (
          temperature !== -999 &&
          Number.isFinite(Number(temperature))
        );
      })
      .map(([date, temperature]) => ({
        date,
        temperature: Number(temperature),
      }));

    return Response.json({
      status: "connected",
      source: "NASA POWER",
      parameter: "T2M",

      location: {
        name: "malaysia",
        latitude,
        longitude,
      },

      readings,
    });
  } catch (error) {
    console.error("NASA Earth Data Error:", error);

    return Response.json(
      {
        status: "error",
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
