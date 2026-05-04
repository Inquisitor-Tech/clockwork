// BillingTests.cs
// Place this in a new folder: ClockworkApi.Tests/BillingTests.cs
// 
// To create the test project, run from your solution root:
//   dotnet new xunit -n ClockworkApi.Tests
//   cd ClockworkApi.Tests
//   dotnet add reference ../ClockworkApi/ClockworkApi.csproj

namespace ClockworkApi.Tests;

public class BillingCalculationTests
{
    // ── Core billing formula ──────────────────────────────────────────────────
    // totalCharge = (durationMinutes / 60) * hourlyRate
    // durationMinutes = Math.Ceiling(elapsedMs / 60000)

    private static decimal CalculateCharge(int durationMinutes, decimal hourlyRate)
    {
        return Math.Round((durationMinutes / 60m) * hourlyRate, 2);
    }

    private static int CalculateDurationMinutes(long elapsedMs)
    {
        return (int)Math.Ceiling(elapsedMs / 60000.0);
    }

    // ── Duration calculation ──────────────────────────────────────────────────

    [Fact]
    public void Duration_ExactlyOneMinute_Returns1()
    {
        var result = CalculateDurationMinutes(60000);
        Assert.Equal(1, result);
    }

    [Fact]
    public void Duration_OneSecond_RoundsUpTo1Minute()
    {
        var result = CalculateDurationMinutes(1000);
        Assert.Equal(1, result);
    }

    [Fact]
    public void Duration_61Seconds_RoundsUpTo2Minutes()
    {
        var result = CalculateDurationMinutes(61000);
        Assert.Equal(2, result);
    }

    [Fact]
    public void Duration_30Minutes_Returns30()
    {
        var result = CalculateDurationMinutes(30 * 60 * 1000);
        Assert.Equal(30, result);
    }

    [Fact]
    public void Duration_90Minutes_Returns90()
    {
        var result = CalculateDurationMinutes(90 * 60 * 1000);
        Assert.Equal(90, result);
    }

    // ── Charge calculation ────────────────────────────────────────────────────

    [Fact]
    public void Charge_60MinutesAt150PerHour_Returns150()
    {
        var result = CalculateCharge(60, 150m);
        Assert.Equal(150.00m, result);
    }

    [Fact]
    public void Charge_30MinutesAt150PerHour_Returns75()
    {
        var result = CalculateCharge(30, 150m);
        Assert.Equal(75.00m, result);
    }

    [Fact]
    public void Charge_15MinutesAt200PerHour_Returns50()
    {
        var result = CalculateCharge(15, 200m);
        Assert.Equal(50.00m, result);
    }

    [Fact]
    public void Charge_90MinutesAt100PerHour_Returns150()
    {
        var result = CalculateCharge(90, 100m);
        Assert.Equal(150.00m, result);
    }

    [Fact]
    public void Charge_1MinuteAt120PerHour_Returns2()
    {
        var result = CalculateCharge(1, 120m);
        Assert.Equal(2.00m, result);
    }

    [Fact]
    public void Charge_ZeroMinutes_ReturnsZero()
    {
        var result = CalculateCharge(0, 150m);
        Assert.Equal(0.00m, result);
    }

    [Fact]
    public void Charge_ZeroRate_ReturnsZero()
    {
        var result = CalculateCharge(60, 0m);
        Assert.Equal(0.00m, result);
    }

    // ── End-to-end: ms → minutes → charge ────────────────────────────────────

    [Fact]
    public void EndToEnd_45MinuteSessionAt200PerHour_Returns150()
    {
        long elapsedMs = 45 * 60 * 1000;
        var minutes = CalculateDurationMinutes(elapsedMs);
        var charge = CalculateCharge(minutes, 200m);
        Assert.Equal(45, minutes);
        Assert.Equal(150.00m, charge);
    }

    [Fact]
    public void EndToEnd_ShortSessionRoundsUpCorrectly()
    {
        // 61 seconds should bill as 2 minutes
        long elapsedMs = 61 * 1000;
        var minutes = CalculateDurationMinutes(elapsedMs);
        var charge = CalculateCharge(minutes, 120m);
        Assert.Equal(2, minutes);
        Assert.Equal(4.00m, charge); // 2/60 * 120 = 4
    }
}

public class DataOwnershipTests
{
    // These test the principle that users only see their own data.
    // They mock the filtering logic used in the controllers.

    private record FakeClient(int Id, int UserId, string FullName);
    private record FakeConsultation(int Id, int UserId, int ClientId);

    [Fact]
    public void Clients_FilteredByUserId_OnlyReturnsOwnClients()
    {
        var allClients = new List<FakeClient>
        {
            new(1, 1, "Alice"),
            new(2, 1, "Bob"),
            new(3, 2, "Charlie"), // belongs to user 2
        };

        var user1Clients = allClients.Where(c => c.UserId == 1).ToList();

        Assert.Equal(2, user1Clients.Count);
        Assert.All(user1Clients, c => Assert.Equal(1, c.UserId));
        Assert.DoesNotContain(user1Clients, c => c.FullName == "Charlie");
    }

    [Fact]
    public void Consultations_FilteredByUserId_OnlyReturnsOwnConsultations()
    {
        var allConsultations = new List<FakeConsultation>
        {
            new(1, 1, 1),
            new(2, 1, 2),
            new(3, 2, 3), // belongs to user 2
        };

        var user1Consultations = allConsultations.Where(c => c.UserId == 1).ToList();

        Assert.Equal(2, user1Consultations.Count);
        Assert.All(user1Consultations, c => Assert.Equal(1, c.UserId));
    }

    [Fact]
    public void Consultations_FilterByClientId_ReturnsOnlyMatchingClient()
    {
        var consultations = new List<FakeConsultation>
        {
            new(1, 1, 10),
            new(2, 1, 10),
            new(3, 1, 20),
        };

        var filtered = consultations.Where(c => c.UserId == 1 && c.ClientId == 10).ToList();

        Assert.Equal(2, filtered.Count);
        Assert.All(filtered, c => Assert.Equal(10, c.ClientId));
    }
}
