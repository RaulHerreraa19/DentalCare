const { expect } = require("chai");
const proxyquire = require("proxyquire");

describe("AppointmentsService.getAppointmentById", () => {
  it("returns appointment when it belongs to organization", async () => {
    const fakeAppointment = {
      id: "apt-1",
      organization_id: "org-1",
      patient: { id: "p1", first_name: "Juan" },
      doctor: { id: "d1", first_name: "Ana" },
      services: [],
      clinic: { id: "c1", name: "Clinica" },
    };

    const fakeDb = {
      appointment: {
        findFirst: async ({ where, include }) => {
          if (where.id === "apt-1" && where.organization_id === "org-1")
            return fakeAppointment;
          return null;
        },
      },
    };

    const AppointmentsService = proxyquire(
      "../../src/modules/appointments/appointments.service",
      {
        "../../config/database": fakeDb,
        "../../utils/AppError": class AppError extends Error {
          constructor(msg, code) {
            super(msg);
            this.statusCode = code;
          }
        },
      },
    );

    const res = await AppointmentsService.getAppointmentById("org-1", "apt-1");
    expect(res).to.equal(fakeAppointment);
  });

  it("throws 404 when appointment belongs to another organization", async () => {
    const fakeDb = {
      appointment: {
        findFirst: async () => null,
      },
    };

    const AppointmentsService = proxyquire(
      "../../src/modules/appointments/appointments.service",
      {
        "../../config/database": fakeDb,
        "../../utils/AppError": class AppError extends Error {
          constructor(msg, code) {
            super(msg);
            this.statusCode = code;
          }
        },
      },
    );

    try {
      await AppointmentsService.getAppointmentById("org-1", "missing");
      throw new Error("Expected to throw");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.match(/Cita no encontrada/);
    }
  });
});
